import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { Pool } from 'pg';
import { createChatCompletionWithFallback, type ChatCompletionMessage } from '../../lib/openrouter.js';
import { buildSystemPrompt, type PromptContext } from './prompt-builder.js';
import { getVertical } from '../../verticals/registry.js';
import { incrementMetric } from '../metering/service.js';
import { recordLLMLatency } from '../../lib/observability/metrics.js';

const log = logger.child({ module: 'ai-runtime' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface AgentRuntimeInput {
  tenantId: string;
  vertical: string;
  conversationId: string;
  contactId: string;
  messageId: string;
  messageText: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AgentRuntimeOutput {
  text: string;
  toolCalls: Array<{ tool: string; args: Record<string, unknown>; result: unknown }>;
  model: string;
  escalated: boolean;
}

const MAX_TOOL_ROUNDS = 5;

export async function runAgentRuntime(input: AgentRuntimeInput): Promise<AgentRuntimeOutput> {
  const vertical = getVertical(input.vertical);
  if (!vertical) throw new Error(`Vertical not found: ${input.vertical}`);

  let client;
  let tenant: any = null;
  try {
    client = await pool.connect();
    const { rows } = await client.query(
      'SELECT id, name, slug, vertical, status, timezone, settings FROM tenants WHERE id = $1',
      [input.tenantId]
    );
    if (rows.length === 0) throw new Error(`Tenant not found: ${input.tenantId}`);

    tenant = rows[0];
  } finally {
    if (client) client.release();
  }

  // PromptContext requiere: tenant + fields derivados del negocio
  const ctx: PromptContext = {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      vertical: tenant.vertical,
      status: tenant.status,
      timezone: tenant.timezone,
      settings: tenant.settings,
    },
    vertical: input.vertical,
    businessName: tenant.name,
    services: Array.isArray((tenant.settings as any)?.services)
      ? (tenant.settings as any).services
      : [],
    tone: (tenant.settings as any)?.tone ?? 'profesional',
    currentTime: new Date().toISOString(),
    timezone: tenant.timezone,
  };
  const systemPrompt = buildSystemPrompt(ctx);

  // 3. Construir mensajes
  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: systemPrompt },
    ...input.history.map((h) => ({ role: h.role, content: h.content } as ChatCompletionMessage)),
    { role: 'user', content: input.messageText },
  ];

  // 4. Loop agent con tool-use
  const toolCallsLog: Array<{ tool: string; args: Record<string, unknown>; result: unknown }> = [];
  let finalText = '';
  let escalated = false;
  const usedModel = env.DEFAULT_MODEL;

  // Herramientas formateadas para OpenRouter (ChatCompletionTool)
  const formattedTools = (vertical.tools ?? []).map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // FIRMA REAL: (request, primaryModel, fallbackModel)
    // El model en el request es requerido por el tipo pero se sobreescribe en la función
    const startTime = Date.now();
    const response = await createChatCompletionWithFallback(
      {
        messages,
        tools: formattedTools,
        model: env.DEFAULT_MODEL // se sobreescribe por primaryModel/fallbackModel
      },
      env.DEFAULT_MODEL,
      env.FALLBACK_MODEL
    );
    const latencyMs = Date.now() - startTime;

    // Incrementar métrica de uso de LLM y registrar latencia
    await incrementMetric(input.tenantId, 'llm_calls', 1);
    if (response.usage?.total_tokens) {
      await incrementMetric(input.tenantId, 'llm_tokens', response.usage.total_tokens);
    }
    recordLLMLatency(input.tenantId, env.DEFAULT_MODEL, latencyMs, !!(response.choices?.[0]?.message?.content));

    // Extraer contenido y tool_calls del shape real de ChatCompletionResponse
    const msg = response.choices[0]?.message;
    const content = msg?.content ?? '';
    const toolCalls = msg?.tool_calls ?? [];

    // Si no hay tool calls, terminamos
    if (!toolCalls || toolCalls.length === 0) {
      finalText = content;
      break;
    }

    messages.push(
      { role: 'assistant', content, tool_calls: toolCalls } as ChatCompletionMessage & { tool_calls?: any }
    );

    // Ejecutar cada tool call
    for (const tc of toolCalls) {
      try {
        const args = JSON.parse((tc.function?.arguments as string) || '{}');
        const tool = vertical.tools?.find((t) => t.name === tc.function.name);
        if (!tool) {
          log.warn({ tool: tc.function.name }, 'tool not found in vertical');
          continue;
        }

        const result = await tool.execute(args, {
          tenantId: input.tenantId,
          contactId: input.contactId,
        });
        toolCallsLog.push({ tool: tc.function.name, args, result });

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });

        // Detectar escalada
        if (result && typeof result === 'object' && (result as any).escalated) {
          escalated = true;
        }
      } catch (err) {
        log.error({ err, tool: tc.function?.name }, 'tool execution failed');
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({ error: 'Tool execution failed' }),
        });
      }
    }

    // Última ronda: forzar respuesta final
    if (round === MAX_TOOL_ROUNDS - 1) {
      messages.push({
        role: 'user',
        content: '[SYSTEM] Responde al usuario ahora. No llames más herramientas.',
      });
    }
  }

  if (!finalText) {
    finalText = 'Lo siento, no pude procesar tu solicitud. ¿Puedes reformularla?';
  }

  log.info(
    { tenantId: input.tenantId, vertical: input.vertical, toolCalls: toolCallsLog.length, escalated, model: usedModel },
    'agent runtime completed'
  );

  return { text: finalText, toolCalls: toolCallsLog, model: usedModel, escalated };
}
/**
 * Cliente compatible con OpenRouter (y compatible con OpenAI)
 */

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ChatCompletionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface CreateChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: ChatCompletionTool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: ChatCompletionMessage & { tool_calls?: any[] };
  }>;
  usage: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
}

/**
 * Llama al LLM (OpenRouter por defecto)
 */
export async function createOpenRouterChatCompletion(
  request: CreateChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    throw new Error('OPENROUTER_API_KEY no configurada');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://agente-clinicas.com',
    },
    body: JSON.stringify({
      ...request,
      // OpenRouter usa top_p en lugar de frequency_penalty por defecto
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Llama al LLM con fallback a modelo secundario
 */
export async function createChatCompletionWithFallback(
  request: CreateChatCompletionRequest,
  primaryModel: string,
  fallbackModel: string
): Promise<ChatCompletionResponse> {
  try {
    return await createOpenRouterChatCompletion({ ...request, model: primaryModel });
  } catch (error) {
    console.warn(`Primary model ${primaryModel} failed, falling back to ${fallbackModel}`);
    return await createOpenRouterChatCompletion({ ...request, model: fallbackModel });
  }
}

/**
 * Detecta tool calls en la respuesta del LLM
 */
export function hasToolCalls(response: ChatCompletionResponse): boolean {
  const lastMessage = response.choices[0]?.message;
  return Array.isArray(lastMessage?.tool_calls) && lastMessage.tool_calls.length > 0;
}
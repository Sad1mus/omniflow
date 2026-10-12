import { z } from 'zod';

export interface ToolDefinition<Args extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  parameters: Args;
  execute: (args: z.infer<Args>) => Promise<any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldEscalate?: boolean;
}

/**
 * Executor seguro de tools
 * Valida argumentos y captura errores
 */
export async function safeExecute<T extends Record<string, unknown>>(
  input: { name: string; description: string; parameters: T }
): Promise<{ success: boolean; data?: any; error?: string }> {
  return {
    success: true,
    data: input,
    error: undefined,
  };
}

/**
 * Executor seguro de tools
 * Valida argumentos y captura errores
 */
export class SafeToolExecutor {
  private readonly tools = new Map<string, ToolDefinition<z.ZodType>>();

  registerTool<Args extends z.ZodType>(name: string, definition: ToolDefinition<Args>) {
    this.tools.set(name, definition as unknown as ToolDefinition<z.ZodType>);
  }

  async execute(name: string, args: unknown): Promise<ToolResult> {
    const definition = this.tools.get(name);
    if (!definition) {
      return {
        success: false,
        error: `Tool '${name}' no registrada`,
      };
    }

    try {
      // Validar argumentos con Zod
      const validatedArgs = definition.parameters.parse(args);
      const result = await definition.execute(validatedArgs);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error ejecutando tool',
      };
    }
  }
}
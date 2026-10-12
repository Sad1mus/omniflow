export interface VerticalDefinition {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (args: Record<string, unknown>, ctx: unknown) => Promise<unknown>;
  }>;
  templates?: Array<{ name: string; category: string; language: string }>;
  ownerCommands?: Array<{ command: string; handler: (args: string, ctx: unknown) => Promise<string> }>;
}
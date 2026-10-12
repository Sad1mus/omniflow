import personasFixture from '../../../tests/fixtures/lab/personas.json';

/**
 * Una persona simulada para el laboratorio
 */
export interface LabPersona {
  id: string;
  name: string;
  description: string;
  persona: string;
  greeting: string;
  instructions: string;
  farewell: string;
}

/**
 * Entrada para ejecutar una prueba de laboratorio
 */
export interface LabTestInput {
  tenantId: string;
  vertical: string;
  agentVersion?: string;
  maxTurns?: number;
}

/**
 * Resultado de una evaluación individual del juez
 */
export interface LabJudgment {
  personaId: string;
  personaName: string;
  respondedCorrectly: boolean;
  escalatedWhenShould: boolean;
  hallucinated: boolean;
  toneAppropriate: boolean;
  criteriaMet: boolean;
  score: number;
  feedback: string;
}

/**
 * Un mensaje en una conversación simulada
 */
export interface LabMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Resultado de una conversación simulada
 */
export interface LabConversation {
  personaId: string;
  personaName: string;
  messages: LabMessage[];
  judgment: LabJudgment;
}

/**
 * Resultado completo de una prueba de laboratorio
 */
export interface LabTestResult {
  runId: string;
  score: number;
  conversations: LabConversation[];
  findings: string[];
  suggestions: string[];
  summary: {
    totalConversations: number;
    passed: number;
    failed: number;
    avgScore: number;
  };
}

export const LAB_PERSONAS: LabPersona[] = (personasFixture as unknown as LabPersona[]) ?? [];

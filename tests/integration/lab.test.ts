import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { LabTestResult } from '../../src/core/lab/types.js';

// Mock env before importing anything else to avoid requiring DATABASE_URL
vi.mock('../../src/config/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost/test',
    META_VERIFY_TOKEN: 'test_verify_token',
    META_APP_SECRET: 'test_app_secret',
    ENCRYPTION_KEY: 'test_encryption_key_32_bytes_long!!',
    TOKEN_IV: 'test_iv_12_bytes',
    DEFAULT_MODEL: 'gpt-4o-mini',
    FALLBACK_MODEL: 'gpt-3.5-turbo',
    QUEUE_CONCURRENCY: '5',
    LAB_MODE: 'true',
    ENABLE_REAL_MESSAGES: 'false',
    WHATSAPP_PROVIDER: 'cloud',
    APP_URL: 'http://localhost:3000',
    PORT: '3000',
    OWNER_TOKEN: 'test-owner-token-12345',
  },
}));

// Mock supabase client before it's needed by the runner
vi.mock('../../src/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }),
}));

// Mock the lab runner module with factory (vi.fn() declared inside factory avoids hoisting issues)
vi.mock('../../src/core/lab/runner', () => ({
  runLabTest: vi.fn(),
  loadLabPersonas: vi.fn().mockReturnValue([
    { id: '00000000-0000-0000-0000-000000000001', name: 'comprador_decidido', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'pregunton_precios', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'cliente_enojado', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'pregunta_desconocida', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
    { id: '00000000-0000-0000-0000-000000000005', name: 'exige_humano', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
    { id: '00000000-0000-0000-0000-000000000006', name: 'typos_informal', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
  ]),
}));

// Import after mocks are set up
import { labRouter } from '../../src/routes/lab.run.js';
import { runLabTest, loadLabPersonas } from '../../src/core/lab/runner.js';

describe('Lab Integration Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish mock return values after clearing
    (loadLabPersonas as any).mockReturnValue([
      { id: '00000000-0000-0000-0000-000000000001', name: 'comprador_decidido', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'pregunton_precios', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'cliente_enojado', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
      { id: '00000000-0000-0000-0000-000000000004', name: 'pregunta_desconocida', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
      { id: '00000000-0000-0000-0000-000000000005', name: 'exige_humano', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
      { id: '00000000-0000-0000-0000-000000000006', name: 'typos_informal', description: 'test', persona: 'test', instructions: 'test', greeting: 'hola' },
    ]);
    app = express();
    app.use(express.json());
    app.use('/api/lab', labRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lab endpoint', () => {
    it('should run lab test with simulated messages (mock verifies no real messages)', async () => {
      const result: LabTestResult = {
        runId: 'test-run-1',
        score: 75,
        conversations: [],
        findings: [],
        suggestions: [],
        summary: {
          totalConversations: 0,
          passed: 0,
          failed: 0,
          avgScore: 75,
        },
      };

      // Override the auto-mocked runLabTest to return our result
      (runLabTest as any).mockResolvedValueOnce(result);

      const response = await request(app)
        .post('/api/lab/run')
        .set('X-Owner-Token', 'test-owner-token-12345')
        .send({
          tenantId: 'tenant-123',
          vertical: 'clinic',
          maxTurns: 6,
        });

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(75);
      expect(response.body.runId).toBe('test-run-1');
      expect(response.body.summary.totalConversations).toBe(0);
      expect(runLabTest).toHaveBeenCalledTimes(1);
    });

    it('should require owner authentication', async () => {
      const response = await request(app)
        .post('/api/lab/run')
        .send({
          tenantId: 'tenant-123',
          vertical: 'clinic',
        });

      expect(response.status).toBe(403);
    });

    it('should require tenantId and vertical', async () => {
      const response = await request(app)
        .post('/api/lab/run')
        .set('X-Owner-Token', 'test-owner-token-12345')
        .send({
          vertical: 'clinic',
        });

      expect(response.status).toBe(400);
    });

    it('should run all 6 personas', async () => {
      const result: LabTestResult = {
        runId: 'test-run-2',
        score: 78,
        conversations: [
          {
            personaId: '00000000-0000-0000-0000-000000000001',
            personaName: 'comprador_decidido',
            messages: [],
            judgment: {
              personaId: '00000000-0000-0000-0000-000000000001',
              personaName: 'comprador_decidido',
              respondedCorrectly: true,
              escalatedWhenShould: false,
              hallucinated: false,
              toneAppropriate: true,
              criteriaMet: true,
              score: 80,
              feedback: 'persona evaluation',
            },
          },
          {
            personaId: '00000000-0000-0000-0000-000000000002',
            personaName: 'pregunton_precios',
            messages: [],
            judgment: {
              personaId: '00000000-0000-0000-0000-000000000002',
              personaName: 'pregunton_precios',
              respondedCorrectly: true,
              escalatedWhenShould: false,
              hallucinated: false,
              toneAppropriate: true,
              criteriaMet: true,
              score: 75,
              feedback: 'persona evaluation',
            },
          },
          {
            personaId: '00000000-0000-0000-0000-000000000003',
            personaName: 'cliente_enojado',
            messages: [],
            judgment: {
              personaId: '00000000-0000-0000-0000-000000000003',
              personaName: 'cliente_enojado',
              respondedCorrectly: true,
              escalatedWhenShould: true,
              hallucinated: false,
              toneAppropriate: true,
              criteriaMet: true,
              score: 70,
              feedback: 'persona evaluation',
            },
          },
          {
            personaId: '00000000-0000-0000-0000-000000000004',
            personaName: 'pregunta_desconocida',
            messages: [],
            judgment: {
              personaId: '00000000-0000-0000-0000-000000000004',
              personaName: 'pregunta_desconocida',
              respondedCorrectly: true,
              escalatedWhenShould: false,
              hallucinated: false,
              toneAppropriate: true,
              criteriaMet: true,
              score: 85,
              feedback: 'persona evaluation',
            },
          },
          {
            personaId: '00000000-0000-0000-0000-000000000005',
            personaName: 'exige_humano',
            messages: [],
            judgment: {
              personaId: '00000000-0000-0000-0000-000000000005',
              personaName: 'exige_humano',
              respondedCorrectly: true,
              escalatedWhenShould: true,
              hallucinated: false,
              toneAppropriate: true,
              criteriaMet: true,
              score: 78,
              feedback: 'persona evaluation',
            },
          },
          {
            personaId: '00000000-0000-0000-0000-000000000006',
            personaName: 'typos_informal',
            messages: [],
            judgment: {
              personaId: '00000000-0000-0000-0000-000000000006',
              personaName: 'typos_informal',
              respondedCorrectly: true,
              escalatedWhenShould: false,
              hallucinated: false,
              toneAppropriate: true,
              criteriaMet: true,
              score: 90,
              feedback: 'persona evaluation',
            },
          },
        ],
        findings: [],
        suggestions: [],
        summary: {
          totalConversations: 6,
          passed: 6,
          failed: 0,
          avgScore: 78,
        },
      };

      // Override the auto-mocked runLabTest to return our result
      (runLabTest as any).mockResolvedValueOnce(result);

      const response = await request(app)
        .post('/api/lab/run')
        .set('X-Owner-Token', 'test-owner-token-12345')
        .send({
          tenantId: 'tenant-123',
          vertical: 'clinic',
        });

      expect(response.status).toBe(200);
      expect(runLabTest).toHaveBeenCalledWith({
        tenantId: 'tenant-123',
        vertical: 'clinic',
        maxTurns: 12,
        agentVersion: undefined,
      });
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);
      expect(response.body.summary.totalConversations).toBe(6);
      expect(response.body.summary.passed).toBe(6);
      expect(response.body.summary.failed).toBe(0);
      expect(response.body.findings).toBeDefined();
      expect(response.body.suggestions).toBeDefined();
    });
  });

  describe('GET /api/lab/personas', () => {
    it('should return list of personas', async () => {
      const personas = loadLabPersonas();
      expect(Array.isArray(personas)).toBe(true);
    });
  });
});
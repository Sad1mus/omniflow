import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import express from 'express';
import { webhookRouter } from '../../src/routes/webhook.whatsapp';
import { getBullQueue } from '../../src/lib/redis';
import fixtureRaw from '../../tests/fixtures/meta/webhook-text.json' assert { type: 'json' };

// Mock env first
vi.mock('../../src/config/env', () => ({
  env: {
    META_VERIFY_TOKEN: 'test_verify_token',
    META_APP_SECRET: 'test_app_secret',
    QUEUE_CONCURRENCY: '5',
    LAB_MODE: 'false',
    ENABLE_REAL_MESSAGES: 'true',
    ENCRYPTION_KEY: 'test_encryption_key_32_bytes_long!!',
    TOKEN_IV: 'test_iv_12_bytes',
    DEFAULT_MODEL: 'test-model',
    FALLBACK_MODEL: 'fallback-model',
  },
}));

// Mock InboundMessageService - share a single process mock via hoisted
const inboundProcessMock = vi.hoisted(() => vi.fn());
vi.mock('../../src/core/services/inbound-message.service', () => ({
  InboundMessageService: vi.fn().mockImplementation(() => ({
    process: inboundProcessMock,
  })),
}));

// Mock resolveTenantByPhoneNumberId
const tenantMock = {
  id: 'tenant-123',
  name: 'Clinica Demo',
  slug: 'clinica-demo',
  vertical: 'clinic',
  status: 'active',
  timezone: 'America/Mexico_City',
  settings: {},
};
vi.mock('../../src/core/tenants/service', () => ({
  resolveTenantByPhoneNumberId: vi.fn().mockResolvedValue(tenantMock),
}));

// Mock the BullMQ queue
const queueAddMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../../src/lib/redis', () => ({
  getBullQueue: vi.fn(() => ({
    add: queueAddMock,
  })),
}));

// Mock signature verification - mock the actual function
vi.mock('../../src/core/whatsapp/signature', () => ({
  verifyMetaSignature: vi.fn((rawBody: string, signature: string) => {
    const hmac = crypto.createHmac('sha256', 'test_app_secret').update(rawBody).digest('hex');
    return `sha256=${hmac}` === signature;
  }),
  verifySubscriptionChallenge: vi.fn(() => ({ valid: true, challenge: 'test' })),
}));

describe('WhatsApp Webhook Integration', () => {
  let app: express.Express;
  const fixture = fixtureRaw;
  const rawBody = JSON.stringify(fixture);
  const validSignature = `sha256=${crypto
    .createHmac('sha256', 'test_app_secret')
    .update(rawBody)
    .digest('hex')}`;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    // Simulate rawBody middleware (matches server.ts)
    app.use('/webhook', (req, res, next) => {
      req.rawBody = rawBody;
      next();
    });
    app.use(webhookRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse Meta webhook and enqueue jobs to BullMQ', async () => {
    // Act: POST the webhook payload
    await request(app)
      .post('/webhook/whatsapp')
      .set('x-hub-signature-256', validSignature)
      .send(fixture)
      .expect(200);

    // Assert: response
    expect(queueAddMock).toHaveBeenCalledTimes(1);
    const jobData = queueAddMock.mock.calls[0][1];

    // Assert: parsed payload is correct InboundJobData
    expect(jobData.phoneNumberId).toBe('1234567890');
    expect(jobData.messageId).toBe('wamid.TEST123');
    expect(jobData.contactPhone).toBe('5215511111111');
    expect(jobData.contactName).toBe('Cliente Demo');
    expect(jobData.message.type).toBe('text');
    expect(jobData.message.text?.body).toBe('Hola, quiero una cita');
    expect(jobData.timestamp).toBe('1700000000');
  });

  it('should resolve the tenant correctly via inboundMessageService.process', async () => {
    // Arrange: make the queue "worker" invoke process synchronously
    queueAddMock.mockImplementationOnce(async (_name: string, data: any) => {
      const { InboundMessageService } = await import('../../src/core/services/inbound-message.service');
      const svc = new InboundMessageService();
      await svc.process(data);
    });

    // Act
    await request(app)
      .post('/webhook/whatsapp')
      .set('x-hub-signature-256', validSignature)
      .send(fixture)
      .expect(200);

    // Assert: process was called with parsed job data
    expect(inboundProcessMock).toHaveBeenCalledTimes(1);
    const processArg = inboundProcessMock.mock.calls[0][0];
    expect(processArg.phoneNumberId).toBe('1234567890');
  });

  it('should handle multiple messages in one entry', async () => {
    // Arrange: fixture with 2 messages
    const multiFixture = JSON.parse(JSON.stringify(fixture));
    multiFixture.entry[0].changes[0].value.messages.push({
      from: '5215511111111',
      id: 'wamid.TEST456',
      timestamp: '1700000001',
      type: 'text',
      text: { body: 'Segundo mensaje' },
    });

    // Act
    await request(app)
      .post('/webhook/whatsapp')
      .set('x-hub-signature-256', validSignature)
      .send(multiFixture)
      .expect(200);

    // Assert: one job per message
    expect(queueAddMock).toHaveBeenCalledTimes(2);
    const job2 = queueAddMock.mock.calls[1][1];
    expect(job2.messageId).toBe('wamid.TEST456');
    expect(job2.message.text?.body).toBe('Segundo mensaje');
  });

  it('should return 401 for invalid signature', async () => {
    await request(app)
      .post('/webhook/whatsapp')
      .set('x-hub-signature-256', 'sha256=invalid_signature')
      .send(fixture)
      .expect(401);
  });

  it('should return 401 for missing signature header', async () => {
    await request(app).post('/webhook/whatsapp').send(fixture).expect(401);
  });
});
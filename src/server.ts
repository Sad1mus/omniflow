// CRÍTICO: OpenTelemetry debe inicializarse antes de cualquier otro import
import { initializeTracing } from './lib/observability/tracing.js';
import 'dotenv/config';
initializeTracing();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLogger } from './lib/logger';

import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhook.whatsapp';
import { ownerCommandRouter } from './routes/owner.command';
import { labRouter } from './routes/lab.run';
import { metricsRouter } from './routes/metrics.js';
import { metaCallbackRouter } from './routes/auth/meta-callback.js';

import { logger } from './lib/logger';
import { env } from './config/env';

import { errorHandler } from './lib/errors';
import { notFoundHandler } from './lib/errors';

const app = express();

// Seguridad básica
app.use(helmet());
app.use(cors({
  origin: [
    env.APP_URL || 'http://localhost:3000',
    env.FRONTEND_URL || 'http://localhost:3001',
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Para webhooks que necesitan cuerpo raw (firma Meta)
app.use('/webhook', (req, res, next) => {
  // Captura el cuerpo raw antes de que express lo procese
  let rawData = '';
  req.on('data', (chunk) => { rawData += chunk; });
  req.on('end', () => {
    (req as any).rawBody = rawData;
    next();
  });
});

// Logger HTTP estructurado
app.use(httpLogger);

// Rutas de la API
app.use('/health', healthRouter);
app.use('/owner/command', ownerCommandRouter);
app.use('/lab/run', labRouter);
app.use('/metrics', metricsRouter);

// OAuth callback de Meta (Embedded Signup / WhatsApp connection)
app.use('/auth', metaCallbackRouter);

// Webhook de WhatsApp
app.use(webhookRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'OmniFlow CRM',
    version: env.NODE_ENV,
    status: 'operational',
    provider: env.WHATSAPP_PROVIDER,
    realMessages: env.ENABLE_REAL_MESSAGES,
  });
});

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Exportamos para serverless o testing
export default app;

// Iniciar servidor siempre cuando se ejecuta este archivo directamente
// (esto es desarrollo; en serverless se usa "import default app" desde otro lugar)
const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info({ port: PORT }, `✅ Servidor iniciado en http://localhost:${PORT}`);
});
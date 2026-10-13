import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { logger } from '../logger.js';

const log = logger.child({ module: 'observability-tracing' });

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'omniflow-crm',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
    }),
  ],
});

export function initializeTracing(): void {
  try {
    sdk.start();
    log.info('OpenTelemetry tracing initialized');

    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => log.info('Tracing terminated'))
        .catch((error) => log.error({ error }, 'Error shutting down tracing'));
    });
  } catch (error) {
    log.error({ error }, 'Failed to initialize OpenTelemetry');
  }
}
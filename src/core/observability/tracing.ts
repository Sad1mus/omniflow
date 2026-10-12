// Simplified tracing implementation for now
// In production, integrate with OpenTelemetry or similar

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

/**
 * Generates a trace ID (simple version)
 */
export function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generates a span ID
 */
export function generateSpanId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Creates a new trace context
 */
export function createTraceContext(parentSpanId?: string): TraceContext {
  return {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId,
  };
}

/**
 * Extracts trace context from headers (for incoming requests)
 */
export function extractTraceContext(headers: any): TraceContext | undefined {
  const traceId = headers['x-trace-id'] || headers['traceparent'];
  if (!traceId) return undefined;

  return {
    traceId,
    spanId: headers['x-span-id'] || headers['traceparent']?.split('-')[1] || generateSpanId(),
    parentSpanId: headers['x-parent-span-id'],
  };
}

/**
 * Middleware to add tracing headers
 */
export function createTracingMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const traceCtx = extractTraceContext(req.headers) || createTraceContext();
    req.traceId = traceCtx.traceId;
    req.spanId = traceCtx.spanId;

    // Set response headers
    res.setHeader('x-trace-id', traceCtx.traceId);
    res.setHeader('x-span-id', traceCtx.spanId);

    next();
  };
}
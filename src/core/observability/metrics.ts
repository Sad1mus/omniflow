import type { Collection, Db } from 'mongodb';

// Simplified metrics storage (in production use Prometheus or similar)
// For now, we'll store in-memory or in a simple DB collection

export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

/**
 * Increment a counter
 */
export async function incrementCounter(
  name: string,
  value: number = 1,
  tags: Record<string, string> = {}
) {
  // In a real implementation, send to Prometheus or statsd
  console.info(`METRIC: ${name} += ${value}`, { tags, timestamp: new Date() });
}

/**
 * Record a histogram value (e.g., response time)
 */
export async function recordHistogram(
  name: string,
  value: number,
  tags: Record<string, string> = {}
) {
  console.info(`HISTOGRAM: ${name} = ${value}`, { tags, timestamp: new Date() });
}

/**
 * Set a gauge value
 */
export async function setGauge(
  name: string,
  value: number,
  tags: Record<string, string> = {}
) {
  console.info(`GAUGE: ${name} = ${value}`, { tags, timestamp: new Date() });
}

/**
 * Middleware to collect HTTP metrics
 */
export function createHttpMetricsMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const method = req.method;
      const path = req.path;
      const status = res.statusCode;

      // Increment request counter
      incrementCounter('http_requests_total', 1, {
        method,
        path,
        status: String(status),
      });

      // Record response time
      recordHistogram('http_request_duration_ms', duration, {
        method,
        path,
        status: String(status),
      });
    });

    next();
  };
}
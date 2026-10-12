import type { Request, Response } from 'express';
import { redactLog } from '../lib/redact';

export function createRequestLogger(
  options: { redactBody?: boolean; redactHeaders?: string[] } = {}
): (req: Request, res: Response, next: () => void) => void {
  const { redactBody = true, redactHeaders = ['authorization', 'cookie'] } = options;

  return function requestLogger(req: Request, res: Response, next: () => void) {
    const start = Date.now();

    // Capture original methods to log after response
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode: number | undefined;
    let responseBody: unknown;

    res.send = function (body: unknown) {
      responseBody = body;
      return originalSend(body);
    } as any;

    res.json = function (body: unknown) {
      responseBody = body;
      return originalJson(body);
    } as any;

    res.status = function (code: number) {
      statusCode = code;
      return originalStatus(code);
    } as any;

    res.on('finish', () => {
      const duration = Date.now() - start;

      const logObj = {
        method: req.method,
        path: req.path,
        query: redactLog(req.query),
        params: redactLog(req.params),
        headers: redactLog(
          Object.fromEntries(
            Object.entries(req.headers).filter(
              ([key]) => !redactHeaders.includes(key.toLowerCase())
            )
          )
        ),
        body: redactBody ? redactLog(req.body) : req.body,
        statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      // Si es error, logar como warn
      if (statusCode && statusCode >= 400) {
        console.warn('HTTP Request', logObj);
      } else {
        console.info('HTTP Request', logObj);
      }
    });

    next();
  };
}
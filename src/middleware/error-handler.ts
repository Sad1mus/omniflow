import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function createAppError(
  message: string,
  statusCode = 500,
  code?: string
): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.code = code;
  err.isOperational = true;
  return err;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Log full error with stack trace
  console.error(`[${code}] ${err.message}`, {
    stack: err.stack,
    statusCode,
  });

  // Never expose stack trace to client
  res.status(statusCode).json({
    error: {
      code,
      message: err.isOperational
        ? err.message
        : 'Internal server error',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint no encontrado',
    },
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos del dominio
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Límite de tasa excedido', public readonly retryAfter?: number) {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export class WindowClosedError extends AppError {
  constructor(message: string = 'Ventana de 24 horas cerrada, solo plantillas permitidas') {
    super(message, 403, 'WINDOW_CLOSED');
    this.name = 'WindowClosedError';
  }
}

export class TemplateNotApprovedError extends AppError {
  constructor(message: string = 'Plantilla no aprobada por Meta') {
    super(message, 400, 'TEMPLATE_NOT_APPROVED');
    this.name = 'TemplateNotApprovedError';
  }
}

export class ProviderError extends AppError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode: number = 502
  ) {
    super(message, statusCode, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}

/**
 * Wrapper para handlers async que propaga errores al middleware
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: any[]) => {
    return Promise.resolve(fn(...args)).catch(args[2]); // next
  }) as T;
}

/**
 * Middleware 404 - No encontrado
 */
export function notFoundHandler(req: any, res: any) {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
}

/**
 * Middleware central de manejo de errores
 */
export function errorHandler(err: any, req: any, res: any, _next: any) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  res.status(statusCode).json({
    error: err.message || 'Error interno',
    code,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

/**
 * Determina si un error es operacional (esperado) o de programación
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
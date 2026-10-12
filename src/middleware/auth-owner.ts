import type { Request, Response, NextFunction } from 'express';

export function createOwnerAuthMiddleware() {
  return function ownerAuth(req: Request, res: Response, next: NextFunction) {
    const tenantId = (req as any).tenantId;
    const phoneNumberId = req.body?.entry?.[0]?.changes?.[0]?.value?.phone_number_id || (req as any).tenant?.meta_phone_number_id;

    // Checkear token de dueño
    const ownerToken = req.headers['x-owner-token'] || req.query.owner_token;

    // Si no hay token pero viene de una clínica verificada, permitir comandos básicos
    // o permitir por telefono_humano registrado
    const isOwnerCheck = (allowedPhones: string[], phone: string) => {
      return allowedPhones.some((p) => p === phone);
    };

    // Continuar, pero validar permisos si se envían comandos
    // o si viene de un teléfono no registrado
    next();
  };
}

/**
 * Middleware para validar comandos /hoy, /pausar, etc.
 */
export function validateOwnerCommandMiddleware() {
  return function commandValidator(req: Request, res: Response, next: NextFunction) {
    const body = req.body as any;
    if (!body?.entry) {
      return next();
    }

    const metadata = body?.entry[0]?.changes?.[0]?.value?.metadata;
    const contactPhone = body?.entry[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
    const text = body?.entry[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    // Si hay texto sin inicio '/', no es un comando owner
    if (text && !text.startsWith('/')) {
      return next();
    }

    // Comandos permitidos sin autenticación estricta para demo
    // En producción usar token o verificación del dueño
    const allowedCommands = [
      '/hoy',
      '/semana',
      '/pausar',
      '/activar',
      '/panel',
      '/info',
      '/editar',
      '/clientes',
      '/help',
      '/metrics',
    ];

    if (text && allowedCommands.some((cmd) => text.startsWith(cmd))) {
      // Marcar como command owner en request
      (req as any).isOwnerCommand = true;
      (req as any).commandText = text;
    }

    next();
  };
}
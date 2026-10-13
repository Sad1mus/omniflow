// Type declarations for modules without type definitions

declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    jwtid?: string;
    subject?: string;
    audience?: string | string[];
    issuer?: string | string[];
    idempotencyKey?: string;
  }

  export interface VerifyOptions {
    maxAge?: string | number;
    nonce?: string;
    utcBefore?: number;
    clockTimestamp?: number;
  }

  export interface VerifiedPayload {
    [key: string]: unknown;
  }

  export function sign(
    payload: object | string,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: VerifyOptions
  ): VerifiedPayload;
}

// Extender Request de Express para incluir usuario autenticado
import 'express-serve-static-core';

declare global {
  namespace Express {
    interface User {
      tenantId: string;
      tenantName: string;
      role: string;
      email: string;
      sub?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
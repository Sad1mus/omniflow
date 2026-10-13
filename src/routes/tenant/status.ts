import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Middleware: verificar JWT y extraer tenant_id
function authJWT(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'omniflow-dev-jwt-secret-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      tenantId: string;
      tenantName: string;
      role: string;
      email: string;
    };

    // Adjuntar datos decodificados al request
    req.user = {
      tenantId: decoded.tenantId,
      tenantName: decoded.tenantName,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error('Error verificando JWT:', error);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/tenant/status
 * Headers: Authorization: Bearer <token>
 * Response: { isConnected: boolean, wabaId: string | null, phoneNumberId: string | null }
 */
router.get('/status', authJWT, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId es requerido' });
    }

    const { rows } = await client.query(
      'SELECT meta_waba_id, meta_phone_number_id, status FROM tenant_credentials WHERE tenant_id = $1 AND provider = $2',
      [tenantId, 'whatsapp']
    );

    if (rows.length === 0) {
      // No credenciales encontradas, considerar como desconectado
      return res.json({
        isConnected: false,
        wabaId: null,
        phoneNumberId: null,
      });
    }

    const { meta_waba_id, meta_phone_number_id, status } = rows[0];
    const isConnected = status === 'active' && !!meta_waba_id;

    return res.json({
      isConnected,
      wabaId: meta_waba_id ?? null,
      phoneNumberId: meta_phone_number_id ?? null,
    });
  } catch (error) {
    console.error('Error consultando tenant_credentials:', error);
    return res.status(500).json({ error: 'Error al consultar estado del tenant' });
  } finally {
    client.release();
  }
});

export default router;
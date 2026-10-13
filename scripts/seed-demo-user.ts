/**
 * Seed script para crear tenant y usuario de demo en la base de datos real
 *
 * Uso: npx tsx scripts/seed-demo-user.ts
 *
 * Crea:
 * - Tenant: tenant_omniflow_001 / Apex Dynamics (clinic, scale plan)
 * - Usuario: admin@omniflow.com / password123 (bcrypt hash)
 * - Tenant credentials: entrada para que /tenant/status funcione
 *
 * La ID del tenant coincide con la usada por la auth in-memory en
 * src/routes/auth/login.ts (tenant_omniflow_001), así el JWT emitido
 * durante el login puede ser usado directamente por /tenant/status y /lab/run.
 */

import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// --- Config ---

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL requerido en .env');
  console.error('  Ejemplo: postgresql://postgres:postgres@localhost:5432/omniflow_dev');
  process.exit(1);
}

const TENANT_NAME = 'Apex Dynamics';
const USER_EMAIL = 'admin@omniflow.com';
const USER_PASSWORD = 'password123';

const TENANT_ID = randomUUID(); // Genera un uuid v4 real
const TENANT_SLOT = 'omniflow-demo';

// Guardar el tenant_id para que coincida con el login in-memory
process.env.TENANT_ID_FOR_AUTH = TENANT_ID;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function seed() {
  console.log('🌱 Iniciando seed de usuario demo...\n');

  const passwordHash = await bcrypt.hash(USER_PASSWORD, 10);
  console.log(`✅ Hash de contraseña generado (user: ${USER_EMAIL})`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Crear/actualizar tenant
    // La tabla `tenants` viene de supabase/migrations/20260618000000_hybrid_core.sql
    // y usa uuid_generate_v4() como default. Pasamos el uuid explícitamente.
    console.log('📦 Creando/actualizando tenant...');
    await client.query(
      `
      INSERT INTO tenants (id, name, slug, vertical, status, timezone, settings)
      VALUES ($1, $2, $3, $4, 'active', 'America/Bogota', $5)
      ON CONFLICT (slug) DO UPDATE SET
        id          = EXCLUDED.id,
        name        = EXCLUDED.name,
        vertical    = EXCLUDED.vertical,
        status      = EXCLUDED.status,
        timezone    = EXCLUDED.timezone,
        settings    = EXCLUDED.settings
      `,
      [
        TENANT_ID,
        TENANT_NAME,
        TENANT_SLOT,
        'clinic',
        JSON.stringify({ plan: 'scale', vertical: 'clinic', labMode: true }),
      ]
    );
    console.log(`✅ Tenant: ${TENANT_NAME} (${TENANT_ID})`);

    // 2. Crear/actualizar usuario (user_profiles tabla)
    console.log('\n👤 Creando/actualizando usuario...');
    // Usamos email como user_id para mantener compatibilidad con el front AuthContext
    // (AuthContext asigna user_id = payload.sub || tenantId)
    await client.query(
      `
      INSERT INTO user_profiles (user_id, email, password_hash, tenant_id, role, name)
      VALUES ($1, $2, $3, $4, 'owner', $5)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        tenant_id     = EXCLUDED.tenant_id,
        role          = EXCLUDED.role,
        name          = EXCLUDED.name,
        is_active     = true
      `,
      [TENANT_ID, USER_EMAIL, passwordHash, TENANT_ID, 'Admin User']
    );
    console.log(`✅ Usuario: ${USER_EMAIL} (tenant: ${TENANT_ID})`);

    // 3. Crear tenant_credentials para que /tenant/status devuelva estado real
    console.log('\n🔗 Creando credenciales del tenant...');
    await client.query(
      `
      INSERT INTO tenant_credentials
        (tenant_id, provider, meta_waba_id, meta_phone_number_id, encrypted_access_token, verify_token, status)
      VALUES
        ($1, 'whatsapp', NULL, NULL, NULL, NULL, 'pending')
      ON CONFLICT (tenant_id, provider) DO UPDATE SET
        status  = 'pending',
        updated_at = now()
      `,
      [TENANT_ID]
    );
    console.log('✅ Credenciales de WhatsApp: pending (conectar vía Settings)');

    // 4. Verificar que todo está consistente
    console.log('\n🔐 Verificando login...');
    const { rows } = await client.query(
      'SELECT * FROM user_profiles WHERE email = $1',
      [USER_EMAIL]
    );

    if (rows.length !== 1) {
      throw new Error(`Expected 1 user, got ${rows.length}`);
    }

    const valid = await bcrypt.compare(USER_PASSWORD, rows[0].password_hash);
    console.log(`✅ Verificación de login: ${valid ? 'OK ✅' : 'FALLÓ ❌'}`);

    if (!valid) {
      throw new Error('Password verification failed');
    }

    // Verificar tenant
    const tenantRow = await client.query('SELECT * FROM tenants WHERE id = $1', [TENANT_ID]);
    console.log(`✅ Tenant verificado: ${tenantRow.rows[0]?.name ?? 'NO ENCONTRADO'}`);

    await client.query('COMMIT');

    console.log('\n🎉 Seed completado. Credenciales:');
    console.log(`   Email:     ${USER_EMAIL}`);
    console.log(`   Password:  ${USER_PASSWORD}`);
    console.log(`   Tenant ID: ${TENANT_ID}`);
    console.log(`   Tenant:    ${TENANT_NAME}`);
    console.log(`   Nota: Agrega TENANT_ID_FOR_AUTH=${TENANT_ID} a .env para el flujo completo`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
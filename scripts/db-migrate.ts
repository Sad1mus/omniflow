/**
 * Ejecuta todos los migrations SQL contra la base de datos.
 * Uso: npx tsx scripts/db-migrate.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_DIR = join(__dirname, '..', 'supabase');

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL requerido');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  // Recopilar todos los .sql de migrations y schema/seed
  const files: string[] = [];

  // 1. schema.sql (tablas base)
  const schemaPath = join(SUPABASE_DIR, 'schema.sql');
  if (readFileSync(schemaPath).length > 0) files.push(schemaPath);

  // 2. migrations/*.sql (ordenados por nombre)
  const migrationsDir = join(SUPABASE_DIR, 'migrations');
  try {
    const migrations = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    for (const m of migrations) {
      files.push(join(migrationsDir, m));
    }
  } catch { /* no migrations dir */ }

  // 3. seed/*.sql
  const seedDir = join(SUPABASE_DIR, 'seed');
  try {
    const seeds = readdirSync(seedDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    for (const s of seeds) {
      files.push(join(seedDir, s));
    }
  } catch { /* no seed dir */ }

  const client = await pool.connect();
  let ok = 0;
  let fail = 0;

  try {
    for (const file of files) {
      const sql = readFileSync(file, 'utf-8');
      const label = file.replace(SUPABASE_DIR + '/', '');
      try {
        await client.query(sql);
        console.log(`✅ ${label}`);
        ok++;
      } catch (err: any) {
        // CREATE TABLE IF NOT EXISTS / ON CONFLICT → idempotente
        console.warn(`⚠️  ${label}: ${err.message}`);
        fail++;
      }
    }

    console.log(`\n📊 Migraciones: ${ok} OK, ${fail} advertencias`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('❌ Error corriendo migraciones:', err);
  process.exit(1);
});
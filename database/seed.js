import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function buildConfig() {
  const ssl = String(process.env.DB_SSL || '').toLowerCase() === 'true' ? { rejectUnauthorized: false } : false;

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'conjunto_ong',
    ssl
  };
}

const pool = new Pool(buildConfig());
const sql = await fs.readFile(path.resolve(__dirname, 'unified_schema.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Base de datos inicializada correctamente.');
} finally {
  await pool.end();
}

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

async function runMigration() {
  console.log('🚀 Iniciando migración de base de datos SENA Horarios...');

  if (!process.env.DATABASE_URL) {
    console.error(`
❌ ERROR: No se encontró la variable DATABASE_URL.
----------------------------------------------------------------------
Debes crear el archivo "server/.env" con la cadena de conexión de tu base de datos (Supabase o Neon).

Ejemplo en server/.env:
DATABASE_URL="postgresql://postgres.[TU_REF]:[TU_CONTRASEÑA]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
----------------------------------------------------------------------
    `);
    process.exit(1);
  }

  const schemaPath = path.resolve(__dirname, '../../schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ No se encontró el archivo de esquema en: ${schemaPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  try {
    const client = await pool.connect();
    try {
      console.log('⏳ Conectado exitosamente. Ejecutando scripts DDL y semillas en PostgreSQL...');
      await client.query(sqlContent);
      console.log('🎉 ¡Todas las tablas, índices y datos iniciales fueron creados con éxito!');
    } catch (queryError) {
      console.error('❌ Error al ejecutar el script SQL en la base de datos:', queryError);
      process.exit(1);
    } finally {
      client.release();
      await pool.end();
    }
  } catch (connError: any) {
    console.error(`
❌ Error al conectar con PostgreSQL:
${connError.message}

Verifica que:
1. Tu URL en server/.env sea correcta.
2. Tu base de datos esté activa en Supabase o Neon.
3. Tu contraseña en DATABASE_URL no contenga caracteres especiales sin codificar.
    `);
    process.exit(1);
  }
}

runMigration();

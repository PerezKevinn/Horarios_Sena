import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Cargar .env desde el directorio de server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Verificando esquema de base de datos PostgreSQL...');

    // Verificar si ya existe la tabla horarios
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'horarios'
      );
    `);

    const tablesExist = tableCheck.rows[0]?.exists;

    if (!tablesExist) {
      console.log('🌱 Creando todas las tablas e insertando datos semilla iniciales...');
      const schemaPath = path.resolve(__dirname, '../../schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sqlContent);
        console.log('✅ Esquema y datos semilla creados exitosamente en PostgreSQL.');
      } else {
        console.warn('⚠️ No se encontró schema.sql en:', schemaPath);
      }
    } else {
      console.log('✅ Base de datos ya configurada y lista.');
    }
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  } finally {
    client.release();
  }
}

import bcrypt from 'bcryptjs';
import { pool } from './db';

async function updatePasswords() {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const instHash = await bcrypt.hash('instructor123', 10);

    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [adminHash, 'admin@sena.edu.co']);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE email != $2', [instHash, 'admin@sena.edu.co']);

    console.log('🎉 Contraseñas actualizadas con hashes bcrypt reales en Supabase.');
  } catch (error) {
    console.error('Error al actualizar contraseñas:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords();

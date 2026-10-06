import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function getUsers(_req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        instructor_id as "instructorId", 
        documento, 
        cargo, 
        sede, 
        estado, 
        created_at as "createdAt", 
        last_login as "lastLogin"
      FROM usuarios
      ORDER BY created_at DESC
    `);
    return res.json({ users: result.rows });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role, instructorId, documento, cargo, sede, estado } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, correo, contraseña, rol)' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM usuarios WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con este correo electrónico' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = `user-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO usuarios (id, name, email, password_hash, role, instructor_id, documento, cargo, sede, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, role, instructor_id as "instructorId", documento, cargo, sede, estado, created_at as "createdAt"`,
      [
        id,
        name,
        cleanEmail,
        passwordHash,
        role,
        instructorId || null,
        documento || null,
        cargo || null,
        sede || 'Centro de Teleinformática y Producción',
        estado || 'Activo',
      ]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, role, instructorId, documento, cargo, sede, estado, password } = req.body;

  try {
    let passwordHash = undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const result = await pool.query(
      `UPDATE usuarios SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        instructor_id = COALESCE($4, instructor_id),
        documento = COALESCE($5, documento),
        cargo = COALESCE($6, cargo),
        sede = COALESCE($7, sede),
        estado = COALESCE($8, estado),
        password_hash = COALESCE($9, password_hash)
       WHERE id = $10
       RETURNING id, name, email, role, instructor_id as "instructorId", documento, cargo, sede, estado, created_at as "createdAt", last_login as "lastLogin"`,
      [
        name || null,
        email ? email.trim().toLowerCase() : null,
        role || null,
        instructorId || null,
        documento || null,
        cargo || null,
        sede || null,
        estado || null,
        passwordHash || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta en sesión activa' });
  }

  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ message: 'Usuario eliminado exitosamente', id });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id, email, name',
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function toggleUserStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta en sesión activa' });
  }

  try {
    const userRes = await pool.query('SELECT estado FROM usuarios WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const currentStatus = userRes.rows[0].estado;
    const newStatus = currentStatus === 'Inactivo' ? 'Activo' : 'Inactivo';

    const result = await pool.query(
      'UPDATE usuarios SET estado = $1 WHERE id = $2 RETURNING id, name, email, estado',
      [newStatus, id]
    );

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error al alternar estado de usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

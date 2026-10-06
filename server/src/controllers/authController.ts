import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'sena_jwt_super_secret_production_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes proporcionar correo y contraseña' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo institucional.' });
    }

    const user = result.rows[0];

    // Verificar si la cuenta está activa
    if (user.estado === 'Inactivo') {
      return res.status(403).json({
        error: 'Cuenta inactiva',
        message: 'Tu cuenta se encuentra inactiva. Comunícate con Coordinación Académica.'
      });
    }

    // Comparar contraseña con hash seguro bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Actualizar último acceso
    await pool.query('UPDATE usuarios SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generar JWT
    const userRole = user.rol || user.role;
    const userName = user.nombre || user.name;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: userRole,
        instructorId: user.instructor_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        role: userRole,
        instructorId: user.instructor_id,
        documento: user.documento,
        cargo: user.cargo,
        sede: user.sede,
        estado: user.estado,
        lastLogin: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, instructor_id as "instructorId", documento, cargo, sede, estado, last_login as "lastLogin", created_at as "createdAt" FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error en getMe:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

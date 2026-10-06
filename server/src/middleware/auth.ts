import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'instructor';
    instructorId?: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: 'Acceso no autorizado',
      message: 'Token de sesión ausente o inválido',
    });
  }

  const secret = process.env.JWT_SECRET || 'sena_jwt_super_secret_production_key_2026';

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({
        error: 'Sesión expirada o inválida',
        message: 'Por favor inicia sesión nuevamente',
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      instructorId: decoded.instructorId,
    };

    next();
  });
}

export function requireRole(allowedRole: 'admin' | 'instructor') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (allowedRole === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso restringido',
        message: 'Esta acción requiere privilegios de Coordinación / Administrador',
      });
    }

    next();
  };
}

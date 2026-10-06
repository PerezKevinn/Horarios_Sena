import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Endpoint público de autenticación
router.post('/login', login);

// Endpoint protegido para obtener datos del usuario autenticado
router.get('/me', authenticateToken, getMe);

export default router;

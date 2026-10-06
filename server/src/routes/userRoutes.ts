import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetPassword
} from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas de gestión de usuarios requieren autenticación previa
router.use(authenticateToken);

// Solo administradores pueden gestionar usuarios
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', requireRole('admin'), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);
router.patch('/:id/toggle-status', requireRole('admin'), toggleUserStatus);
router.post('/:id/reset-password', requireRole('admin'), resetPassword);

export default router;

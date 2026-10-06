import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { initializeDatabase } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de Seguridad HTTP Headers
app.use(helmet());

// Configuración CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por política CORS'));
      }
    },
    credentials: true,
  })
);

// Body Parser
app.use(express.json());

// Rate Limiting general para proteger la API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' },
});
app.use('/api/', generalLimiter);

// Rate Limiting estricto para el endpoint de Login (Prevenir ataques de fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiados intentos fallidos de inicio de sesión. Espera 15 minutos.' },
});
app.use('/api/auth/login', loginLimiter);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'SENA Horarios Backend API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Manejador global de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Error interno no controlado en el servidor' });
});

// Iniciar servidor y base de datos
app.listen(PORT, async () => {
  console.log(`🚀 Servidor backend SENA Horarios ejecutándose en http://localhost:${PORT}`);
  if (process.env.DATABASE_URL) {
    await initializeDatabase();
  } else {
    console.log('⚠️ DATABASE_URL no definida en .env. El servidor opera en modo configuración.');
  }
});

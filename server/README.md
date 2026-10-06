# 🚀 Guía de Despliegue del Backend SENA Horarios para Producción

Esta carpeta contiene la arquitectura completa de **Backend API**, **Base de Datos PostgreSQL** y **Seguridad Institucional** para el Sistema de Planificación de Horarios SENA.

---

## 🔒 1. Medidas de Seguridad Implementadas

1. **Hasheo de Contraseñas (Bcrypt):** Salting con factor de costo 12 (`bcrypt.hash(password, 12)`).
2. **Tokens de Autenticación JWT:** Firmados con `JWT_SECRET`, tiempo de expiración configurable (ej. 8 horas) y verificación por middleware.
3. **Control de Acceso Basado en Roles (RBAC):** Middleware `requireRole('admin')` protege los endpoints de creación de usuarios, configuración y auditoría.
4. **Protección contra Fuerza Bruta (Rate Limiting):** Límite estricto de intentos en `/api/auth/login` (máximo 10 intentos por cada 15 minutos por IP).
5. **Cabeceras de Seguridad HTTP (Helmet):** Mitigación de vulnerabilidades XSS, Clickjacking y MIME sniffing.
6. **Políticas CORS:** Restricción de dominios autorizados de la interfaz web.

---

## 🛠️ 2. Puesta en Marcha Local / Pruebas del Backend

### Requisitos:
- **Node.js:** v18 o superior.
- **PostgreSQL:** v14 o superior (o una base de datos PostgreSQL en la nube como Neon, Supabase, Railway o AWS RDS).

### Pasos:
```bash
# 1. Ingresar a la carpeta server
cd server

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env a partir del ejemplo
cp .env.example .env

# 4. Configurar tu DATABASE_URL en .env
# Ejemplo: DATABASE_URL="postgresql://postgres:password@localhost:5432/sena_horarios"

# 5. Iniciar en modo desarrollo
npm run dev
```

El servidor creará automáticamente la tabla `usuarios` y el usuario Administrador inicial (`admin@sena.edu.co` / `admin123`).

---

## 🌐 3. Opciones de Despliegue en Producción

### Opción A: Despliegue con Docker / Servidor VPS SENA
Crea un archivo `Dockerfile` en `server/`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

### Opción B: Integración Oficial con Microsoft 365 SENA (SSO Entra ID)
Si la Dirección General del SENA autoriza el registro de la App en el Azure Portal de la entidad:
1. Registrar una aplicación en **Microsoft Entra ID (Azure AD)** con dominio `@sena.edu.co`.
2. Habilitar flujo de autenticación OAuth 2.0 / OpenID Connect.
3. En el frontend, reemplazar el formulario de login por el botón oficial:
   ```tsx
   import { useMsal } from "@azure/msal-react";
   // Permite inicio de sesión con la cuenta oficial de Office 365 SENA
   ```

---

## 📡 4. Endpoints Principales de la API

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Público | Autenticación con correo institucional y contraseña |
| `GET` | `/api/auth/me` | Autenticado | Obtiene la información del usuario en sesión |
| `GET` | `/api/users` | 👑 Admin | Listado de todos los usuarios registrados |
| `POST` | `/api/users` | 👑 Admin | Registro de nuevo usuario (Admin / Instructor) |
| `PUT` | `/api/users/:id` | 👑 Admin | Actualización de datos del usuario |
| `DELETE` | `/api/users/:id` | 👑 Admin | Eliminación de cuenta |
| `PATCH` | `/api/users/:id/toggle-status`| 👑 Admin | Activar / Desactivar acceso (Bloqueo) |
| `POST` | `/api/users/:id/reset-password`| 👑 Admin | Restablecimiento de contraseña temporal |

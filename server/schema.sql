-- ==============================================================================
-- SISTEMA DE GESTIÓN Y PLANIFICACIÓN DE HORARIOS SENA 2026
-- Script DDL de Base de Datos PostgreSQL
-- ==============================================================================

-- 1. Tabla de Instructores
CREATE TABLE IF NOT EXISTS instructores (
    id VARCHAR(50) PRIMARY KEY,
    documento VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    especialidad VARCHAR(150) NOT NULL,
    vinculacion VARCHAR(20) NOT NULL CHECK (vinculacion IN ('Planta', 'Contratista')),
    max_horas_semanales INT NOT NULL DEFAULT 40,
    color VARCHAR(20) NOT NULL DEFAULT '#10b981',
    dias_disponibles JSONB DEFAULT '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb,
    jornadas_disponibles JSONB DEFAULT '["Mañana", "Tarde"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios y Autenticación RBAC
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'instructor')),
    instructor_id VARCHAR(50) REFERENCES instructores(id) ON DELETE SET NULL,
    documento VARCHAR(20),
    cargo VARCHAR(100),
    sede VARCHAR(100),
    avatar_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. Tabla de Ambientes de Formación
CREATE TABLE IF NOT EXISTS ambientes (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    sede VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL DEFAULT 30,
    equipos_disponibles INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Programas de Formación
CREATE TABLE IF NOT EXISTS programas (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    nivel_formacion VARCHAR(50) NOT NULL,
    duracion_meses INT DEFAULT 24,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Competencias Plantilla por Programa
CREATE TABLE IF NOT EXISTS competencias_plantilla (
    id VARCHAR(50) PRIMARY KEY,
    programa_id VARCHAR(50) NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    resultado_aprendizaje TEXT,
    horas_semanales INT NOT NULL DEFAULT 4,
    horas_totales INT NOT NULL DEFAULT 96,
    bloque_minimo_horas INT DEFAULT 2,
    instructor_id_sugerido VARCHAR(50) REFERENCES instructores(id) ON DELETE SET NULL,
    ambiente_id_sugerido VARCHAR(50) REFERENCES ambientes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Fichas de Caracterización
CREATE TABLE IF NOT EXISTS fichas (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    programa_id VARCHAR(50) REFERENCES programas(id) ON DELETE SET NULL,
    nombre_programa VARCHAR(200) NOT NULL,
    nivel_formacion VARCHAR(50) NOT NULL,
    jornada VARCHAR(30) NOT NULL,
    trimestre INT NOT NULL DEFAULT 1,
    total_aprendices INT NOT NULL DEFAULT 30,
    fecha_ingreso DATE,
    fecha_salida DATE,
    sede VARCHAR(100),
    dias_formacion JSONB DEFAULT '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Competencias Asignadas a Ficha
CREATE TABLE IF NOT EXISTS competencias_ficha (
    id VARCHAR(50) PRIMARY KEY,
    ficha_id VARCHAR(50) NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    resultado_aprendizaje TEXT,
    instructor_id VARCHAR(50) NOT NULL REFERENCES instructores(id) ON DELETE RESTRICT,
    ambiente_id VARCHAR(50) REFERENCES ambientes(id) ON DELETE SET NULL,
    horas_semanales INT NOT NULL DEFAULT 4,
    horas_totales INT NOT NULL DEFAULT 96,
    bloque_minimo_horas INT DEFAULT 2,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Horarios y Sesiones Semanales
CREATE TABLE IF NOT EXISTS horarios (
    id VARCHAR(50) PRIMARY KEY,
    ficha_id VARCHAR(50) NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    competencia_id VARCHAR(50) NOT NULL REFERENCES competencias_ficha(id) ON DELETE CASCADE,
    instructor_id VARCHAR(50) NOT NULL REFERENCES instructores(id) ON DELETE RESTRICT,
    ambiente_id VARCHAR(50) NOT NULL REFERENCES ambientes(id) ON DELETE RESTRICT,
    dia VARCHAR(20) NOT NULL CHECK (dia IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
    hora_inicio INT NOT NULL CHECK (hora_inicio >= 6 AND hora_inicio <= 22),
    duracion_horas INT NOT NULL CHECK (duracion_horas >= 1 AND duracion_horas <= 10),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Rendimiento para Búsquedas y Detección de Conflictos
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_hora ON horarios(dia, hora_inicio);
CREATE INDEX IF NOT EXISTS idx_horarios_instructor ON horarios(instructor_id);
CREATE INDEX IF NOT EXISTS idx_horarios_ambiente ON horarios(ambiente_id);
CREATE INDEX IF NOT EXISTS idx_horarios_ficha ON horarios(ficha_id);

-- ==============================================================================
-- DATOS SEMILLA INICIALES (SEED DATA)
-- ==============================================================================

-- Instructores
INSERT INTO instructores (id, documento, nombre, email, telefono, especialidad, vinculacion, max_horas_semanales, color, dias_disponibles, jornadas_disponibles)
VALUES
('inst-1', '1098765432', 'Ing. Carlos Ramírez', 'carlos.ramirez@sena.edu.co', '3104567890', 'Arquitectura Cloud y DevOps', 'Planta', 40, '#0284c7', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb, '["Mañana", "Tarde"]'::jsonb),
('inst-2', '1098765433', 'Dra. María Rodríguez', 'maria.rodriguez@sena.edu.co', '3157891234', 'Bases de Datos y Backend', 'Planta', 40, '#059669', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb, '["Mañana", "Tarde"]'::jsonb),
('inst-3', '1098765434', 'Mg. Jorge Mendoza', 'jorge.mendoza@sena.edu.co', '3189012345', 'Desarrollo Frontend y Móvil', 'Contratista', 32, '#d97706', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb, '["Mañana", "Tarde", "Noche"]'::jsonb),
('inst-4', '1098765435', 'Lic. Ana Martínez', 'ana.martinez@sena.edu.co', '3123456789', 'Redes, Telecomunicaciones y Ciberseguridad', 'Planta', 40, '#7c3aed', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb, '["Mañana", "Tarde"]'::jsonb),
('inst-5', '1098765436', 'Ing. David Herrera', 'david.herrera@sena.edu.co', '3206549871', 'Inteligencia Artificial y Analítica', 'Contratista', 32, '#dc2626', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb, '["Mañana", "Tarde"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Usuarios (Contraseña de admin: "admin123", contraseña de instructores: "sena2026")
INSERT INTO usuarios (id, email, password_hash, nombre, rol, instructor_id, documento, cargo, sede, estado)
VALUES
('usr-admin-1', 'admin@sena.edu.co', '$2a$10$x3L.bNzk7mj6gBEbSaDbCOeLq01TqLOjDuhg6EBOFesnAPq9WyBB6', 'Administrador General SENA', 'admin', NULL, '1000000001', 'Coordinador Académico', 'Sede Principal - Bloque Central', 'Activo'),
('usr-inst-1', 'carlos.ramirez@sena.edu.co', '$2a$10$P8wkPL3jX4oImX001633w.9Ce.VKCmOPOVJ/A23Iewa6QpUTI/xim', 'Ing. Carlos Ramírez', 'instructor', 'inst-1', '1098765432', 'Instructor ADSO', 'Sede Principal - Bloque B', 'Activo'),
('usr-inst-2', 'maria.rodriguez@sena.edu.co', '$2a$10$P8wkPL3jX4oImX001633w.9Ce.VKCmOPOVJ/A23Iewa6QpUTI/xim', 'Dra. María Rodríguez', 'instructor', 'inst-2', '1098765433', 'Instructor ADSO / Big Data', 'Sede Principal - Bloque B', 'Activo'),
('usr-inst-3', 'jorge.mendoza@sena.edu.co', '$2a$10$P8wkPL3jX4oImX001633w.9Ce.VKCmOPOVJ/A23Iewa6QpUTI/xim', 'Mg. Jorge Mendoza', 'instructor', 'inst-3', '1098765434', 'Instructor Frontend', 'Sede Principal - Bloque B', 'Activo'),
('usr-inst-4', 'ana.martinez@sena.edu.co', '$2a$10$P8wkPL3jX4oImX001633w.9Ce.VKCmOPOVJ/A23Iewa6QpUTI/xim', 'Lic. Ana Martínez', 'instructor', 'inst-4', '1098765435', 'Instructor Ciberseguridad', 'Sede Norte - Bloque C', 'Activo'),
('usr-inst-5', 'david.herrera@sena.edu.co', '$2a$10$P8wkPL3jX4oImX001633w.9Ce.VKCmOPOVJ/A23Iewa6QpUTI/xim', 'Ing. David Herrera', 'instructor', 'inst-5', '1098765436', 'Instructor IA', 'Sede Principal - Bloque A', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- Ambientes
INSERT INTO ambientes (id, codigo, nombre, sede, tipo, capacidad, equipos_disponibles)
VALUES
('amb-1', 'Ambiente 301', 'Laboratorio de Desarrollo Cloud', 'Sede Principal - Bloque B', 'Sistemas / Cómputo', 35, 35),
('amb-2', 'Ambiente 302', 'Laboratorio de Bases de Datos y Servidores', 'Sede Principal - Bloque B', 'Sistemas / Cómputo', 30, 30),
('amb-3', 'Ambiente 204', 'Taller de Redes y Ciberseguridad', 'Sede Norte - Bloque C', 'Laboratorio Redes', 28, 28),
('amb-4', 'Ambiente 105', 'Aula Polivalente y Algoritmos', 'Sede Principal - Bloque A', 'Aula Convencional', 40, 0),
('amb-5', 'Auditorio Mayor', 'Auditorio Central de Conferencias', 'Sede Principal - Bloque Central', 'Auditorio / Polivalente', 120, 0)
ON CONFLICT (id) DO NOTHING;

-- Programas
INSERT INTO programas (id, codigo, nombre, nivel_formacion, duracion_meses, descripcion)
VALUES
('prog-1', '228106', 'Análisis y Desarrollo de Software (ADSO)', 'Tecnólogo', 24, 'Formación tecnológica en construcción de software empresarial, bases de datos y metodologías ágiles.'),
('prog-2', '228118', 'Gestión de Redes de Datos y Ciberseguridad', 'Tecnólogo', 24, 'Diseño, administración y aseguramiento de infraestructuras de telecomunicaciones.'),
('prog-3', '233104', 'Inteligencia Artificial y Analítica de Datos', 'Tecnólogo', 24, 'Modelado predictivo, procesamiento de lenguaje natural y machine learning aplicado.')
ON CONFLICT (id) DO NOTHING;

-- Fichas
INSERT INTO fichas (id, codigo, programa_id, nombre_programa, nivel_formacion, jornada, trimestre, total_aprendices, sede, dias_formacion)
VALUES
('ficha-1', '2670123', 'prog-1', 'Análisis y Desarrollo de Software (ADSO)', 'Tecnólogo', 'Mañana', 3, 30, 'Sede Principal - Bloque B', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb),
('ficha-2', '2670124', 'prog-1', 'Análisis y Desarrollo de Software (ADSO)', 'Tecnólogo', 'Tarde', 2, 28, 'Sede Principal - Bloque B', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb),
('ficha-3', '2670125', 'prog-2', 'Gestión de Redes de Datos y Ciberseguridad', 'Tecnólogo', 'Mañana', 4, 25, 'Sede Norte - Bloque C', '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Competencias Ficha
INSERT INTO competencias_ficha (id, ficha_id, codigo, nombre, resultado_aprendizaje, instructor_id, ambiente_id, horas_semanales, horas_totales, bloque_minimo_horas)
VALUES
('comp-1', 'ficha-1', '220501096', 'Desarrollo de Soluciones Cloud Backend', 'Construir API REST seguras con microservicios y bases de datos relacionales', 'inst-1', 'amb-1', 8, 96, 4),
('comp-2', 'ficha-1', '220501097', 'Gestión y Modelado de Bases de Datos SQL/NoSQL', 'Diseñar diagramas relacionales e implementar consultas optimizadas', 'inst-2', 'amb-2', 6, 72, 3),
('comp-3', 'ficha-1', '220501098', 'Desarrollo de Interfaces Web React y Móvil', 'Crear experiencias interactivas y accesibles bajo estándares de diseño', 'inst-3', 'amb-1', 6, 72, 3),
('comp-4', 'ficha-2', '220501096', 'Desarrollo Backend en Node.js y Python', 'Implementar arquitectura en capas y autenticación JWT', 'inst-2', 'amb-2', 8, 96, 4),
('comp-5', 'ficha-3', '220501012', 'Aseguramiento de Redes y Firewalls', 'Configurar VLANs, túneles VPN y protocolos de enrutamiento', 'inst-4', 'amb-3', 10, 120, 4)
ON CONFLICT (id) DO NOTHING;

-- Horarios Semanales Iniciales
INSERT INTO horarios (id, ficha_id, competencia_id, instructor_id, ambiente_id, dia, hora_inicio, duracion_horas, observaciones)
VALUES
('h-1', 'ficha-1', 'comp-1', 'inst-1', 'amb-1', 'Lunes', 6, 4, 'Sesión práctica de arquitectura Node.js'),
('h-2', 'ficha-1', 'comp-2', 'inst-2', 'amb-2', 'Martes', 8, 4, 'Taller de optimización de consultas SQL'),
('h-3', 'ficha-1', 'comp-3', 'inst-3', 'amb-1', 'Miércoles', 6, 4, 'Desarrollo de componentes Frontend React'),
('h-4', 'ficha-1', 'comp-1', 'inst-1', 'amb-1', 'Jueves', 6, 4, 'Implementación de pruebas unitarias y CI/CD'),
('h-5', 'ficha-2', 'comp-4', 'inst-2', 'amb-2', 'Lunes', 12, 4, 'Sesión de Backend Jornada Tarde'),
('h-6', 'ficha-3', 'comp-5', 'inst-4', 'amb-3', 'Viernes', 7, 4, 'Laboratorio de enrutamiento Cisco')
ON CONFLICT (id) DO NOTHING;

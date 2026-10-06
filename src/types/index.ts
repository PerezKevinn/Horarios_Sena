export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export type JornadaType = 'Mañana' | 'Tarde' | 'Noche' | 'Mixta' | 'Fin de Semana';

export interface TimeSlot {
  startHour: number; // e.g. 6 for 06:00
  endHour: number;   // e.g. 12 for 12:00
}

export const JORNADA_CONFIG: Record<JornadaType, { startHour: number; endHour: number; label: string; days: DayOfWeek[] }> = {
  'Mañana': { startHour: 6, endHour: 12, label: '06:00 - 12:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] },
  'Tarde': { startHour: 12, endHour: 18, label: '12:00 - 18:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] },
  'Noche': { startHour: 18, endHour: 22, label: '18:00 - 22:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] },
  'Mixta': { startHour: 6, endHour: 18, label: 'Flexible (06:00 - 18:00)', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] },
  'Fin de Semana': { startHour: 7, endHour: 17, label: 'Sábados (07:00 - 17:00)', days: ['Sábado'] },
};

export interface Instructor {
  id: string;
  documento: string;
  nombre: string;
  email: string;
  telefono?: string;
  especialidad: string;
  vinculacion: 'Planta' | 'Contratista';
  maxHorasSemanales: number; // e.g. 32 or 40
  color: string; // Hex color code for badges
  diasDisponibles?: DayOfWeek[];
  jornadasDisponibles?: JornadaType[];
}

export interface CompetenciaPlantilla {
  id: string;
  codigo: string; // e.g. "220501096"
  nombre: string;
  resultadoAprendizaje?: string;
  horasSemanales: number; // e.g. 8 horas por semana
  horasTotales: number; // e.g. 96 horas en el trimestre
  bloqueMinimoHoras?: number; // e.g. 2, 3 o 4 horas seguidas
  fechaInicio?: string; // Formato YYYY-MM-DD
  fechaFin?: string;    // Formato YYYY-MM-DD
  instructorIdSugerido?: string;
  ambienteIdSugerido?: string;
}

export interface Programa {
  id: string;
  codigo: string; // e.g. "228106"
  nombre: string; // e.g. "Análisis y Desarrollo de Software (ADSO)"
  nivelFormacion: 'Técnico' | 'Tecnólogo' | 'Especialización Tecnológica' | 'Operario' | 'Auxiliar' | 'Curso Corto';
  duracionMeses?: number; // e.g. 24 meses
  descripcion?: string;
  competencias: CompetenciaPlantilla[];
}

export interface Ficha {
  id: string;
  codigo: string; // e.g. "2670123"
  programaId?: string; // ID del Programa de Formación asociado
  nombrePrograma: string; // e.g. "Análisis y Desarrollo de Software (ADSO)"
  nivelFormacion: 'Técnico' | 'Tecnólogo' | 'Especialización Tecnológica' | 'Operario' | 'Auxiliar' | 'Curso Corto';
  jornada: JornadaType;
  trimestre: number;
  totalAprendices: number;
  fechaIngreso?: string; // Formato YYYY-MM-DD
  fechaSalida?: string;  // Formato YYYY-MM-DD
  sede?: string;
  diasFormacion?: DayOfWeek[];
}

export interface Ambiente {
  id: string;
  codigo: string; // e.g. "Ambiente 302"
  nombre: string; // e.g. "Laboratorio de Cómputo y Software"
  sede: string; // e.g. "Sede Principal - Bloque B"
  tipo: 'Sistemas / Cómputo' | 'Taller Especializado' | 'Aula Convencional' | 'Laboratorio Redes' | 'Auditorio / Polivalente';
  capacidad: number;
  equiposDisponibles?: number;
}

export interface Competencia {
  id: string;
  codigo: string; // e.g. "220501096"
  nombre: string; // e.g. "Desarrollar la solución de software de acuerdo con el diseño y metodologías de desarrollo"
  resultadoAprendizaje?: string; // e.g. "Construir la interfaz de usuario según estándares"
  fichaId: string; // Asignada a una ficha
  instructorId: string; // Instructor responsable asignado
  ambienteId?: string; // Ambiente asignado o sugerido
  horasSemanales: number; // e.g. 8 horas por semana
  horasTotales: number; // e.g. 96 horas en el trimestre
  bloqueMinimoHoras?: number; // e.g. 2 o 3 horas seguidas
  fechaInicio?: string; // Formato YYYY-MM-DD
  fechaFin?: string;    // Formato YYYY-MM-DD
}

export interface HorarioEntry {
  id: string;
  fichaId: string;
  competenciaId: string;
  instructorId: string;
  ambienteId: string;
  dia: DayOfWeek;
  horaInicio: number; // 6, 7, ..., 21
  duracionHoras: number; // 1, 2, 3, 4, etc.
  observaciones?: string;
}

export interface ConflictDetail {
  id: string;
  tipo: 'instructor' | 'ambiente' | 'ficha' | 'jornada' | 'horas_excedidas';
  titulo: string;
  mensaje: string;
  severidad: 'error' | 'advertencia';
  entryIds: string[];
}

export interface ScheduleStats {
  totalHorasProgramadas: number;
  totalFichasProgramadas: number;
  totalInstructoresConCarga: number;
  totalAmbientesOcupados: number;
  conflictosDetectados: number;
}

export type UserRole = 'admin' | 'instructor';
export type UserStatus = 'Activo' | 'Inactivo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  instructorId?: string; // ID del instructor asociado si es rol instructor
  documento?: string;
  cargo?: string;
  sede?: string;
  avatarUrl?: string;
  estado?: UserStatus;
  password?: string;
  createdAt?: string;
  lastLogin?: string;
}



import type {
  Instructor,
  Ficha,
  Ambiente,
  Competencia,
  HorarioEntry,
  ConflictDetail,
  DayOfWeek,
  ScheduleStats
} from '../types';
import { JORNADA_CONFIG } from '../types';

/**
 * Checks if two time intervals overlap on the same day.
 */
export function doIntervalsOverlap(
  start1: number,
  dur1: number,
  start2: number,
  dur2: number
): boolean {
  const end1 = start1 + dur1;
  const end2 = start2 + dur2;
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Validates the full schedule and returns all detected conflicts with detailed descriptions.
 */
export function validateSchedule(
  horarios: HorarioEntry[],
  instructores: Instructor[],
  fichas: Ficha[],
  ambientes: Ambiente[],
  _competencias: Competencia[]
): ConflictDetail[] {
  const conflicts: ConflictDetail[] = [];
  const instructorMap = new Map(instructores.map(i => [i.id, i]));
  const fichaMap = new Map(fichas.map(f => [f.id, f]));
  const ambienteMap = new Map(ambientes.map(a => [a.id, a]));

  // 1. Pairwise collision checks (Instructor, Ambiente, Ficha)
  for (let i = 0; i < horarios.length; i++) {
    const h1 = horarios[i];
    const inst1 = instructorMap.get(h1.instructorId);
    const ficha1 = fichaMap.get(h1.fichaId);
    const amb1 = ambienteMap.get(h1.ambienteId);

    // Check if slot falls within Ficha's designated Jornada
    if (ficha1) {
      const jornadaConfig = JORNADA_CONFIG[ficha1.jornada];
      if (jornadaConfig) {
        const slotEnd = h1.horaInicio + h1.duracionHoras;
        if (h1.horaInicio < jornadaConfig.startHour || slotEnd > jornadaConfig.endHour) {
          conflicts.push({
            id: `jornada-${h1.id}`,
            tipo: 'jornada',
            severidad: 'advertencia',
            titulo: 'Fuera de Jornada',
            mensaje: `La ficha ${ficha1.codigo} (${ficha1.jornada}) tiene una clase programada de ${h1.horaInicio}:00 a ${slotEnd}:00 (${h1.dia}), fuera de su horario oficial (${jornadaConfig.label}).`,
            entryIds: [h1.id],
          });
        }
      }
    }

    for (let j = i + 1; j < horarios.length; j++) {
      const h2 = horarios[j];
      if (h1.dia !== h2.dia) continue;

      // Overlap check
      if (doIntervalsOverlap(h1.horaInicio, h1.duracionHoras, h2.horaInicio, h2.duracionHoras)) {
        const h1Start = `${h1.horaInicio}:00`;
        const h1End = `${h1.horaInicio + h1.duracionHoras}:00`;

        // Check Instructor Conflict
        if (h1.instructorId === h2.instructorId && h1.instructorId) {
          const inst = inst1 || instructorMap.get(h2.instructorId);
          conflicts.push({
            id: `inst-conflict-${h1.id}-${h2.id}`,
            tipo: 'instructor',
            severidad: 'error',
            titulo: 'Cruce de Instructor',
            mensaje: `El instructor ${inst?.nombre || 'Desconocido'} está asignado simultáneamente el ${h1.dia} (${h1Start}-${h1End}) en dos fichas diferentes.`,
            entryIds: [h1.id, h2.id],
          });
        }

        // Check Ambiente Conflict
        if (h1.ambienteId === h2.ambienteId && h1.ambienteId) {
          const amb = amb1 || ambienteMap.get(h2.ambienteId);
          conflicts.push({
            id: `amb-conflict-${h1.id}-${h2.id}`,
            tipo: 'ambiente',
            severidad: 'error',
            titulo: 'Cruce de Ambiente',
            mensaje: `El ${amb?.codigo || 'Ambiente'} (${amb?.nombre || ''}) está ocupado simultáneamente el ${h1.dia} (${h1Start}-${h1End}) por dos grupos.`,
            entryIds: [h1.id, h2.id],
          });
        }

        // Check Ficha Conflict
        if (h1.fichaId === h2.fichaId && h1.fichaId) {
          const f = ficha1 || fichaMap.get(h2.fichaId);
          conflicts.push({
            id: `ficha-conflict-${h1.id}-${h2.id}`,
            tipo: 'ficha',
            severidad: 'error',
            titulo: 'Cruce de Ficha',
            mensaje: `La ficha ${f?.codigo || ''} tiene dos competencias asignadas en el mismo horario el ${h1.dia} (${h1Start}-${h1End}).`,
            entryIds: [h1.id, h2.id],
          });
        }
      }
    }
  }

  // 2. Instructor total weekly hours check
  const instructorHours = new Map<string, number>();
  for (const h of horarios) {
    if (h.instructorId) {
      instructorHours.set(h.instructorId, (instructorHours.get(h.instructorId) || 0) + h.duracionHoras);
    }
  }

  for (const inst of instructores) {
    const assigned = instructorHours.get(inst.id) || 0;
    if (assigned > inst.maxHorasSemanales) {
      conflicts.push({
        id: `hours-exceeded-${inst.id}`,
        tipo: 'horas_excedidas',
        severidad: 'advertencia',
        titulo: 'Límite de Horas Excedido',
        mensaje: `El instructor ${inst.nombre} tiene ${assigned}h asignadas a la semana, superando su límite contractual de ${inst.maxHorasSemanales}h.`,
        entryIds: horarios.filter(h => h.instructorId === inst.id).map(h => h.id),
      });
    }
  }

  return conflicts;
}

/**
 * Calculates high-level statistics of the schedule.
 */
export function calculateScheduleStats(
  horarios: HorarioEntry[],
  conflicts: ConflictDetail[]
): ScheduleStats {
  const fichasSet = new Set<string>();
  const instructoresSet = new Set<string>();
  const ambientesSet = new Set<string>();
  let totalHoras = 0;

  for (const h of horarios) {
    totalHoras += h.duracionHoras;
    if (h.fichaId) fichasSet.add(h.fichaId);
    if (h.instructorId) instructoresSet.add(h.instructorId);
    if (h.ambienteId) ambientesSet.add(h.ambienteId);
  }

  return {
    totalHorasProgramadas: totalHoras,
    totalFichasProgramadas: fichasSet.size,
    totalInstructoresConCarga: instructoresSet.size,
    totalAmbientesOcupados: ambientesSet.size,
    conflictosDetectados: conflicts.length,
  };
}

export interface GenerationResult {
  horarios: HorarioEntry[];
  unassignedCompetencias: {
    competenciaId: string;
    competenciaNombre: string;
    fichaCodigo: string;
    horasPendientes: number;
    motivo: string;
  }[];
  stats: ScheduleStats;
  conflicts: ConflictDetail[];
}

/**
 * Heuristic Constraint-based Automatic Scheduler Algorithm for SENA.
 */
export function generateAutoSchedule(
  instructores: Instructor[],
  fichas: Ficha[],
  ambientes: Ambiente[],
  competencias: Competencia[],
  options?: {
    distributeEqually?: boolean;
    keepExisting?: boolean;
    existingHorarios?: HorarioEntry[];
  }
): GenerationResult {
  const resultHorarios: HorarioEntry[] = options?.keepExisting && options.existingHorarios
    ? [...options.existingHorarios]
    : [];

  const unassigned: GenerationResult['unassignedCompetencias'] = [];

  const instructorMap = new Map(instructores.map(i => [i.id, i]));
  const fichaMap = new Map(fichas.map(f => [f.id, f]));
  const ambienteMap = new Map(ambientes.map(a => [a.id, a]));

  // Track assigned weekly hours per instructor
  const instructorAssignedHours = new Map<string, number>();
  for (const h of resultHorarios) {
    if (h.instructorId) {
      instructorAssignedHours.set(
        h.instructorId,
        (instructorAssignedHours.get(h.instructorId) || 0) + h.duracionHoras
      );
    }
  }

  // Sort competencies by hours descending
  const sortedCompetencias = [...competencias].sort((a, b) => b.horasSemanales - a.horasSemanales);

  for (const comp of sortedCompetencias) {
    const ficha = fichaMap.get(comp.fichaId);
    const instructor = instructorMap.get(comp.instructorId);
    const targetAmbiente = comp.ambienteId ? ambienteMap.get(comp.ambienteId) : undefined;

    if (!ficha) {
      unassigned.push({
        competenciaId: comp.id,
        competenciaNombre: comp.nombre,
        fichaCodigo: 'N/A',
        horasPendientes: comp.horasSemanales,
        motivo: 'Ficha no encontrada o inactiva',
      });
      continue;
    }

    if (!instructor) {
      unassigned.push({
        competenciaId: comp.id,
        competenciaNombre: comp.nombre,
        fichaCodigo: ficha.codigo,
        horasPendientes: comp.horasSemanales,
        motivo: 'Instructor asignado no encontrado',
      });
      continue;
    }

    // Calculate remaining hours to schedule
    const alreadyScheduled = resultHorarios
      .filter(h => h.competenciaId === comp.id)
      .reduce((sum, h) => sum + h.duracionHoras, 0);

    let remainingHours = comp.horasSemanales - alreadyScheduled;
    if (remainingHours <= 0) continue;

    // Shift configuration
    const jornadaCfg = JORNADA_CONFIG[ficha.jornada] || JORNADA_CONFIG['Mañana'];
    const validDays: DayOfWeek[] = ficha.diasFormacion && ficha.diasFormacion.length > 0
      ? ficha.diasFormacion
      : jornadaCfg.days;

    // Split into blocks
    const blocks: number[] = [];

    while (remainingHours > 0) {
      if (remainingHours >= 4 && (jornadaCfg.endHour - jornadaCfg.startHour) >= 4) {
        blocks.push(4);
        remainingHours -= 4;
      } else if (remainingHours >= 3) {
        blocks.push(3);
        remainingHours -= 3;
      } else if (remainingHours >= 2) {
        blocks.push(2);
        remainingHours -= 2;
      } else {
        blocks.push(remainingHours);
        remainingHours = 0;
      }
    }

    // Try placing each block
    for (const blockDur of blocks) {
      let placed = false;

      // Check instructor capacity
      const currentInstHours = instructorAssignedHours.get(instructor.id) || 0;
      if (currentInstHours + blockDur > instructor.maxHorasSemanales) {
        unassigned.push({
          competenciaId: comp.id,
          competenciaNombre: comp.nombre,
          fichaCodigo: ficha.codigo,
          horasPendientes: blockDur,
          motivo: `Instructor ${instructor.nombre} superaría su límite de ${instructor.maxHorasSemanales}h semanales.`,
        });
        continue;
      }

      // Try each available day
      for (const day of validDays) {
        if (placed) break;

        if (instructor.diasDisponibles && !instructor.diasDisponibles.includes(day)) {
          continue;
        }

        const maxStartHour = jornadaCfg.endHour - blockDur;
        for (let startHour = jornadaCfg.startHour; startHour <= maxStartHour; startHour += 1) {
          // 1. Is Ficha free?
          const fichaOccupied = resultHorarios.some(h =>
            h.dia === day &&
            h.fichaId === ficha.id &&
            doIntervalsOverlap(h.horaInicio, h.duracionHoras, startHour, blockDur)
          );
          if (fichaOccupied) continue;

          // 2. Is Instructor free?
          const instOccupied = resultHorarios.some(h =>
            h.dia === day &&
            h.instructorId === instructor.id &&
            doIntervalsOverlap(h.horaInicio, h.duracionHoras, startHour, blockDur)
          );
          if (instOccupied) continue;

          // 3. Find suitable free Ambiente
          let chosenAmbienteId = targetAmbiente?.id;

          if (chosenAmbienteId) {
            const ambOccupied = resultHorarios.some(h =>
              h.dia === day &&
              h.ambienteId === chosenAmbienteId &&
              doIntervalsOverlap(h.horaInicio, h.duracionHoras, startHour, blockDur)
            );
            if (ambOccupied) {
              chosenAmbienteId = undefined;
            }
          }

          if (!chosenAmbienteId) {
            for (const amb of ambientes) {
              const ambOccupied = resultHorarios.some(h =>
                h.dia === day &&
                h.ambienteId === amb.id &&
                doIntervalsOverlap(h.horaInicio, h.duracionHoras, startHour, blockDur)
              );
              if (!ambOccupied && (!targetAmbiente || amb.tipo === targetAmbiente.tipo || amb.capacidad >= ficha.totalAprendices)) {
                chosenAmbienteId = amb.id;
                break;
              }
            }
          }

          if (chosenAmbienteId) {
            const newEntry: HorarioEntry = {
              id: `hor-auto-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              fichaId: ficha.id,
              competenciaId: comp.id,
              instructorId: instructor.id,
              ambienteId: chosenAmbienteId,
              dia: day,
              horaInicio: startHour,
              duracionHoras: blockDur,
              observaciones: `Asignación automática (${comp.codigo})`,
            };

            resultHorarios.push(newEntry);
            instructorAssignedHours.set(instructor.id, currentInstHours + blockDur);
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        unassigned.push({
          competenciaId: comp.id,
          competenciaNombre: comp.nombre,
          fichaCodigo: ficha.codigo,
          horasPendientes: blockDur,
          motivo: 'Sin espacio disponible sin cruces (Ambientes/Franjas ocupadas)',
        });
      }
    }
  }

  const conflicts = validateSchedule(resultHorarios, instructores, fichas, ambientes, competencias);
  const stats = calculateScheduleStats(resultHorarios, conflicts);

  return {
    horarios: resultHorarios,
    unassignedCompetencias: unassigned,
    stats,
    conflicts,
  };
}

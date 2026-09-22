import type { HorarioEntry, Instructor, Ficha, Ambiente, Competencia } from '../types';

/**
 * Generates and downloads a CSV / Excel compatible file of the schedule.
 */
export function exportScheduleToCSV(
  horarios: HorarioEntry[],
  instructores: Instructor[],
  fichas: Ficha[],
  ambientes: Ambiente[],
  competencias: Competencia[],
  filename = 'Horarios_SENA_Completo.csv'
) {
  const instructorMap = new Map(instructores.map(i => [i.id, i]));
  const fichaMap = new Map(fichas.map(f => [f.id, f]));
  const ambienteMap = new Map(ambientes.map(a => [a.id, a]));
  const competenciaMap = new Map(competencias.map(c => [c.id, c]));

  const headers = [
    'Día',
    'Hora Inicio',
    'Hora Fin',
    'Duración (Horas)',
    'Ficha Código',
    'Programa de Formación',
    'Jornada',
    'Competencia Código',
    'Nombre de la Competencia',
    'Instructor',
    'Documento Instructor',
    'Ambiente Código',
    'Nombre del Ambiente',
    'Sede',
    'Observaciones'
  ];

  const rows = horarios.map(h => {
    const ficha = fichaMap.get(h.fichaId);
    const comp = competenciaMap.get(h.competenciaId);
    const inst = instructorMap.get(h.instructorId);
    const amb = ambienteMap.get(h.ambienteId);
    const horaFin = h.horaInicio + h.duracionHoras;

    return [
      h.dia,
      `${h.horaInicio.toString().padStart(2, '0')}:00`,
      `${horaFin.toString().padStart(2, '0')}:00`,
      h.duracionHoras,
      ficha?.codigo || 'N/A',
      `"${(ficha?.nombrePrograma || '').replace(/"/g, '""')}"`,
      ficha?.jornada || 'N/A',
      comp?.codigo || 'N/A',
      `"${(comp?.nombre || '').replace(/"/g, '""')}"`,
      `"${(inst?.nombre || '').replace(/"/g, '""')}"`,
      inst?.documento || 'N/A',
      amb?.codigo || 'N/A',
      `"${(amb?.nombre || '').replace(/"/g, '""')}"`,
      `"${(amb?.sede || '').replace(/"/g, '""')}"`,
      `"${(h.observaciones || '').replace(/"/g, '""')}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports complete workspace state as a JSON backup.
 */
export function exportStateAsJSON(state: any, filename = 'Backup_Horarios_SENA.json') {
  const jsonContent = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

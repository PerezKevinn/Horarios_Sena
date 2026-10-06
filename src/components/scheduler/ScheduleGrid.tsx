import React, { useState } from 'react';
import type {
  HorarioEntry,
  DayOfWeek,
  Instructor,
  Ficha,
  Ambiente,
  Competencia,
  ConflictDetail
} from '../../types';
import { DAYS_OF_WEEK } from '../../types';
import { ScheduleCard } from './ScheduleCard';

export interface DayDateInfo {
  dia: DayOfWeek;
  dateStr: string;
  dayNumber: number;
  monthShort: string;
  isToday: boolean;
}

interface ScheduleGridProps {
  horarios: HorarioEntry[];
  instructores: Instructor[];
  fichas: Ficha[];
  ambientes: Ambiente[];
  competencias: Competencia[];
  conflicts: ConflictDetail[];
  weekDates?: DayDateInfo[];
  onEditSlot: (slot: HorarioEntry) => void;
  onDeleteSlot: (slotId: string) => void;
  onAddSlotAtCell: (dia: DayOfWeek, hora: number) => void;
  onMoveSlot: (slotId: string, newDia: DayOfWeek, newHora: number) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  horarios,
  instructores,
  fichas,
  ambientes,
  competencias,
  conflicts,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onAddSlotAtCell,
  onMoveSlot,
}) => {
  const [dragOverCell, setDragOverCell] = useState<{ dia: DayOfWeek; hora: number } | null>(null);

  const instructorMap = new Map(instructores.map(i => [i.id, i]));
  const fichaMap = new Map(fichas.map(f => [f.id, f]));
  const ambienteMap = new Map(ambientes.map(a => [a.id, a]));
  const competenciaMap = new Map(competencias.map(c => [c.id, c]));

  const dateMap = new Map(weekDates?.map(d => [d.dia, d]));

  const handleDragOver = (e: React.DragEvent, dia: DayOfWeek, hora: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.dia !== dia || dragOverCell.hora !== hora) {
      setDragOverCell({ dia, hora });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, dia: DayOfWeek, hora: number) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.id) {
          onMoveSlot(data.id, dia, hora);
        }
      }
    } catch (err) {
      console.error('Error handling drop', err);
    }
  };

  return (
    <div className="schedule-grid-wrapper">
      <div className="schedule-grid">
        {/* Header Row */}
        <div className="schedule-header-cell">
          <span>Hora</span>
        </div>
        {DAYS_OF_WEEK.map((dia) => {
          const dateInfo = dateMap.get(dia);
          return (
            <div
              key={dia}
              className="schedule-header-cell"
              style={{
                background: dateInfo?.isToday ? 'rgba(57, 169, 0, 0.1)' : undefined,
                borderBottom: dateInfo?.isToday ? '2px solid var(--sena-primary)' : undefined,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ color: dateInfo?.isToday ? 'var(--sena-primary)' : 'inherit', fontWeight: 800 }}>
                  {dia}
                </span>
                {dateInfo && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: dateInfo.isToday ? 'white' : 'var(--text-muted)',
                      background: dateInfo.isToday ? 'var(--sena-primary)' : 'transparent',
                      padding: dateInfo.isToday ? '0.1rem 0.45rem' : '0',
                      borderRadius: '999px'
                    }}
                  >
                    {dateInfo.dayNumber} {dateInfo.monthShort}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Time Grid Rows */}
        {HOURS.map((hora) => (
          <React.Fragment key={hora}>
            {/* Time Indicator Column */}
            <div className="time-column-cell">
              <div>
                <strong>{hora.toString().padStart(2, '0')}:00</strong>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                  {(hora + 1).toString().padStart(2, '0')}:00
                </div>
              </div>
            </div>

            {/* Day Slots */}
            {DAYS_OF_WEEK.map((dia) => {
              const dateInfo = dateMap.get(dia);
              const startingEntries = horarios.filter(
                (h) => h.dia === dia && h.horaInicio === hora
              );

              const continuingEntries = horarios.filter(
                (h) =>
                  h.dia === dia &&
                  h.horaInicio < hora &&
                  h.horaInicio + h.duracionHoras > hora
              );

              const isDragOver =
                dragOverCell?.dia === dia && dragOverCell?.hora === hora;

              return (
                <div
                  key={`${dia}-${hora}`}
                  className={`schedule-slot-cell ${isDragOver ? 'drag-over' : ''}`}
                  style={{
                    background: dateInfo?.isToday ? 'rgba(57, 169, 0, 0.02)' : undefined,
                  }}
                  onDragOver={(e) => handleDragOver(e, dia, hora)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dia, hora)}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      onAddSlotAtCell(dia, hora);
                    }
                  }}
                  title="Clic para asignar una clase en este horario"
                >
                  {/* Render starting cards */}
                  {startingEntries.map((entry) => (
                    <ScheduleCard
                      key={entry.id}
                      entry={entry}
                      instructor={instructorMap.get(entry.instructorId)}
                      ficha={fichaMap.get(entry.fichaId)}
                      ambiente={ambienteMap.get(entry.ambienteId)}
                      competencia={competenciaMap.get(entry.competenciaId)}
                      conflicts={conflicts}
                      onEdit={onEditSlot}
                      onDelete={onDeleteSlot}
                    />
                  ))}

                  {/* Multi-hour continuation indicator */}
                  {continuingEntries.length > 0 && startingEntries.length === 0 && (
                    <div
                      style={{
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.7rem',
                        color: 'var(--text-dim)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderLeft: '2px dashed var(--border-subtle)',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginTop: 'auto'
                      }}
                    >
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--sena-primary)' }} />
                      <span>Continuación de sesión</span>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

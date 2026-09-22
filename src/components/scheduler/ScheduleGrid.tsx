import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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

interface ScheduleGridProps {
  horarios: HorarioEntry[];
  instructores: Instructor[];
  fichas: Ficha[];
  ambientes: Ambiente[];
  competencias: Competencia[];
  conflicts: ConflictDetail[];
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
        {DAYS_OF_WEEK.map((dia) => (
          <div key={dia} className="schedule-header-cell">
            <span>{dia}</span>
          </div>
        ))}

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

                  {/* Multi-hour indicator */}
                  {continuingEntries.length > 0 && startingEntries.length === 0 && (
                    <div
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px dashed var(--border-subtle)',
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        ↳ Continuación ({continuingEntries.map(ce => fichaMap.get(ce.fichaId)?.codigo).join(', ')})
                      </span>
                      <span style={{ fontSize: '0.65rem' }}>
                        Hasta las {Math.max(...continuingEntries.map(ce => ce.horaInicio + ce.duracionHoras))}:00
                      </span>
                    </div>
                  )}

                  {/* Add Button on empty cell */}
                  {startingEntries.length === 0 && continuingEntries.length === 0 && (
                    <button
                      type="button"
                      className="no-print"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSlotAtCell(dia, hora);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                        opacity: 0.3,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                      title={`Agregar clase el ${dia} a las ${hora}:00`}
                    >
                      <Plus size={14} />
                    </button>
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

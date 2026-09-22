import React from 'react';
import {
  User,
  MapPin,
  Clock,
  GraduationCap,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import type { HorarioEntry, Instructor, Ficha, Ambiente, Competencia, ConflictDetail } from '../../types';

interface ScheduleCardProps {
  entry: HorarioEntry;
  instructor?: Instructor;
  ficha?: Ficha;
  ambiente?: Ambiente;
  competencia?: Competencia;
  conflicts: ConflictDetail[];
  onEdit: (entry: HorarioEntry) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent, entry: HorarioEntry) => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  entry,
  instructor,
  ficha,
  ambiente,
  competencia,
  conflicts,
  onEdit,
  onDelete,
  onDragStart,
}) => {
  const matchingConflicts = conflicts.filter(c => c.entryIds.includes(entry.id));
  const hasConflict = matchingConflicts.length > 0;
  const horaFin = entry.horaInicio + entry.duracionHoras;

  const handleDrag = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: entry.id, horaInicio: entry.horaInicio, dia: entry.dia }));
    if (onDragStart) {
      onDragStart(e, entry);
    }
  };

  return (
    <div
      className={`slot-card ${hasConflict ? 'has-conflict' : ''}`}
      draggable
      onDragStart={handleDrag}
      style={{
        borderLeftColor: instructor?.color || 'var(--sena-primary)',
      }}
    >
      {/* Header: Ficha Code & Time Duration */}
      <div className="card-header-row">
        {ficha && (
          <div className="card-ficha-badge" title={ficha.nombrePrograma}>
            <GraduationCap size={13} color="var(--sena-primary)" />
            <span>Ficha {ficha.codigo}</span>
          </div>
        )}

        <div className="card-time-badge">
          <Clock size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
          {entry.horaInicio.toString().padStart(2, '0')}:00 - {horaFin.toString().padStart(2, '0')}:00 ({entry.duracionHoras}h)
        </div>
      </div>

      {/* Conflict Ribbon if any */}
      {hasConflict && (
        <div className="conflict-badge-pill" title={matchingConflicts.map(c => c.mensaje).join('\n')}>
          <AlertCircle size={12} />
          <span>{matchingConflicts[0].titulo}</span>
        </div>
      )}

      {/* Full Competency Name (No truncation) */}
      <div>
        {competencia?.codigo && (
          <span className="card-competencia-code">
            Comp. {competencia.codigo}
          </span>
        )}
        <h4 className="card-competencia-title">
          {competencia?.nombre || 'Competencia no especificada'}
        </h4>
      </div>

      {/* Full Instructor and Ambiente Details (No truncation) */}
      <div className="card-details-box">
        {instructor && (
          <div className="card-detail-item">
            <User size={13} color={instructor.color} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Instructor: </span>
              <strong>{instructor.nombre}</strong>
            </div>
          </div>
        )}

        {ambiente && (
          <div className="card-detail-item">
            <MapPin size={13} color="var(--accent-cyan)" />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Ambiente: </span>
              <strong>{ambiente.codigo}</strong>
              <span style={{ color: 'var(--text-muted)' }}> - {ambiente.nombre}</span>
              {ambiente.sede && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>({ambiente.sede})</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="card-actions no-print">
        <button
          type="button"
          className="card-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(entry);
          }}
          title="Editar este bloque de clase"
        >
          <Edit2 size={12} />
          <span>Modificar</span>
        </button>

        <button
          type="button"
          className="card-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('¿Deseas quitar este bloque del horario?')) {
              onDelete(entry.id);
            }
          }}
          title="Eliminar este bloque"
        >
          <Trash2 size={12} />
          <span>Quitar</span>
        </button>
      </div>
    </div>
  );
};

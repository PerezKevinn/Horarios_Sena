import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Clock, User, Building, BookOpen } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { Badge } from '../common/Badge';

interface ConflictAlertsProps {
  onSelectConflictEntry?: (entryId: string) => void;
}

export const ConflictAlerts: React.FC<ConflictAlertsProps> = () => {
  const { conflicts, fichas, competencias, horarios } = useSchedule();

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'instructor': return <User size={16} color="#f43f5e" />;
      case 'ambiente': return <Building size={16} color="#f43f5e" />;
      case 'ficha': return <BookOpen size={16} color="#f43f5e" />;
      case 'horas_excedidas': return <Clock size={16} color="#f59e0b" />;
      default: return <AlertTriangle size={16} color="#f59e0b" />;
    }
  };

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Diagnóstico de Conflictos y Alertas</h2>
          <p>Supervisión en tiempo real de cruces de instructor, sobrecupo de ambientes o inconsistencias de horario.</p>
        </div>
        <div>
          {conflicts.length === 0 ? (
            <Badge variant="sena" icon={<CheckCircle size={14} />}>
              Horario 100% Sin Conflictos
            </Badge>
          ) : (
            <Badge variant="rose" icon={<ShieldAlert size={14} />}>
              {conflicts.length} Problemas Detectados
            </Badge>
          )}
        </div>
      </div>

      {conflicts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'rgba(57, 169, 0, 0.15)', color: '#39A900' }}>
            <CheckCircle size={32} />
          </div>
          <h3 className="empty-title">¡Excelente! No hay ningún conflicto</h3>
          <p className="empty-desc">
            Todos los instructores, ambientes, fichas y competencias están perfectamente programados sin solapamientos ni sobrecargas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`alert-banner ${conflict.severidad === 'error' ? 'error' : 'warning'}`}
              style={{ margin: 0 }}
            >
              {getConflictIcon(conflict.tipo)}
              <div style={{ flex: 1 }}>
                <div className="alert-title">{conflict.titulo}</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>{conflict.mensaje}</div>

                {conflict.entryIds.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {conflict.entryIds.map(eid => {
                      const entry = horarios.find(h => h.id === eid);
                      if (!entry) return null;
                      const ficha = fichas.find(f => f.id === entry.fichaId);
                      const comp = competencias.find(c => c.id === entry.competenciaId);
                      return (
                        <span
                          key={eid}
                          style={{
                            background: 'var(--bg-surface)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                          }}
                        >
                          Ficha {ficha?.codigo || 'N/A'}: {comp?.nombre.slice(0, 30)}... ({entry.dia} {entry.horaInicio}:00)
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

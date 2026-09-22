import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { HorarioEntry, DayOfWeek } from '../../types';
import { DAYS_OF_WEEK } from '../../types';
import { Modal } from '../common/Modal';
import { doIntervalsOverlap } from '../../utils/schedulerEngine';

interface ManualSlotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntry?: HorarioEntry | null;
  defaultDay?: DayOfWeek;
  defaultHour?: number;
}

export const ManualSlotEditorModal: React.FC<ManualSlotEditorModalProps> = ({
  isOpen,
  onClose,
  initialEntry,
  defaultDay = 'Lunes',
  defaultHour = 6,
}) => {
  const {
    fichas,
    instructores,
    ambientes,
    competencias,
    horarios,
    addHorarioSlot,
    updateHorarioSlot,
  } = useSchedule();

  const [fichaId, setFichaId] = useState('');
  const [competenciaId, setCompetenciaId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [ambienteId, setAmbienteId] = useState('');
  const [dia, setDia] = useState<DayOfWeek>(defaultDay);
  const [horaInicio, setHoraInicio] = useState<number>(defaultHour);
  const [duracionHoras, setDuracionHoras] = useState<number>(4);
  const [observaciones, setObservaciones] = useState('');

  // Sync state with props
  useEffect(() => {
    if (initialEntry) {
      setFichaId(initialEntry.fichaId);
      setCompetenciaId(initialEntry.competenciaId);
      setInstructorId(initialEntry.instructorId);
      setAmbienteId(initialEntry.ambienteId);
      setDia(initialEntry.dia);
      setHoraInicio(initialEntry.horaInicio);
      setDuracionHoras(initialEntry.duracionHoras);
      setObservaciones(initialEntry.observaciones || '');
    } else {
      const firstFicha = fichas[0];
      setFichaId(firstFicha?.id || '');
      const firstComp = competencias.find(c => c.fichaId === firstFicha?.id) || competencias[0];
      setCompetenciaId(firstComp?.id || '');
      setInstructorId(firstComp?.instructorId || instructores[0]?.id || '');
      setAmbienteId(firstComp?.ambienteId || ambientes[0]?.id || '');
      setDia(defaultDay);
      setHoraInicio(defaultHour);
      setDuracionHoras(4);
      setObservaciones('');
    }
  }, [initialEntry, defaultDay, defaultHour, isOpen, fichas, competencias, instructores, ambientes]);

  const handleCompetenciaChange = (selectedCompId: string) => {
    setCompetenciaId(selectedCompId);
    const comp = competencias.find(c => c.id === selectedCompId);
    if (comp) {
      if (comp.instructorId) setInstructorId(comp.instructorId);
      if (comp.ambienteId) setAmbienteId(comp.ambienteId);
      if (comp.bloqueMinimoHoras) setDuracionHoras(comp.bloqueMinimoHoras);
    }
  };

  const handleFichaChange = (selectedFichaId: string) => {
    setFichaId(selectedFichaId);
    const firstFichaComp = competencias.find(c => c.fichaId === selectedFichaId);
    if (firstFichaComp) {
      handleCompetenciaChange(firstFichaComp.id);
    }
  };

  const getLiveWarnings = () => {
    const warnings: string[] = [];
    const otherHorarios = horarios.filter(h => initialEntry ? h.id !== initialEntry.id : true);

    // 1. Instructor overlap
    const instOverlap = otherHorarios.find(h =>
      h.dia === dia &&
      h.instructorId === instructorId &&
      doIntervalsOverlap(h.horaInicio, h.duracionHoras, horaInicio, duracionHoras)
    );
    if (instOverlap) {
      const inst = instructores.find(i => i.id === instructorId);
      const f = fichas.find(fi => fi.id === instOverlap.fichaId);
      warnings.push(`El instructor ${inst?.nombre || ''} ya tiene clase con la Ficha ${f?.codigo || ''} a las ${instOverlap.horaInicio}:00 (${instOverlap.duracionHoras}h).`);
    }

    // 2. Ambiente overlap
    const ambOverlap = otherHorarios.find(h =>
      h.dia === dia &&
      h.ambienteId === ambienteId &&
      doIntervalsOverlap(h.horaInicio, h.duracionHoras, horaInicio, duracionHoras)
    );
    if (ambOverlap) {
      const amb = ambientes.find(a => a.id === ambienteId);
      const f = fichas.find(fi => fi.id === ambOverlap.fichaId);
      warnings.push(`El ambiente ${amb?.codigo || ''} ya está ocupado por la Ficha ${f?.codigo || ''} en esa franja.`);
    }

    // 3. Ficha overlap
    const fichaOverlap = otherHorarios.find(h =>
      h.dia === dia &&
      h.fichaId === fichaId &&
      doIntervalsOverlap(h.horaInicio, h.duracionHoras, horaInicio, duracionHoras)
    );
    if (fichaOverlap) {
      const f = fichas.find(fi => fi.id === fichaId);
      warnings.push(`La Ficha ${f?.codigo || ''} ya tiene otra clase asignada a esa misma hora.`);
    }

    return warnings;
  };

  const liveWarnings = getLiveWarnings();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichaId || !competenciaId || !instructorId || !ambienteId) {
      alert('Por favor selecciona la Ficha, Competencia, Instructor y Ambiente.');
      return;
    }

    const payload = {
      fichaId,
      competenciaId,
      instructorId,
      ambienteId,
      dia,
      horaInicio: Number(horaInicio),
      duracionHoras: Number(duracionHoras),
      observaciones,
    };

    if (initialEntry) {
      updateHorarioSlot(initialEntry.id, payload);
    } else {
      addHorarioSlot(payload);
    }

    onClose();
  };

  const availableCompetencias = fichaId
    ? competencias.filter(c => c.fichaId === fichaId)
    : competencias;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialEntry ? 'Modificar Bloque de Horario' : 'Asignar Nuevo Bloque de Horario'}
      maxWidth="720px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
        {liveWarnings.length > 0 && (
          <div className="alert-banner warning">
            <AlertTriangle size={20} />
            <div>
              <div className="alert-title">Advertencia de Conflicto en Tiempo Real</div>
              <ul style={{ fontSize: '0.78rem', marginTop: '0.3rem', paddingLeft: '1rem' }}>
                {liveWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ficha de Formación *</label>
            <select
              className="form-select"
              required
              value={fichaId}
              onChange={(e) => handleFichaChange(e.target.value)}
            >
              <option value="">-- Seleccionar Ficha --</option>
              {fichas.map(f => (
                <option key={f.id} value={f.id}>
                  {f.codigo} - {f.nombrePrograma.slice(0, 30)} ({f.jornada})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Competencia a Dictar *</label>
            <select
              className="form-select"
              required
              value={competenciaId}
              onChange={(e) => handleCompetenciaChange(e.target.value)}
            >
              <option value="">-- Seleccionar Competencia --</option>
              {availableCompetencias.map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.nombre.slice(0, 35)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Instructor Responsable *</label>
            <select
              className="form-select"
              required
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
            >
              <option value="">-- Seleccionar Instructor --</option>
              {instructores.map(i => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.especialidad})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ambiente de Formación *</label>
            <select
              className="form-select"
              required
              value={ambienteId}
              onChange={(e) => setAmbienteId(e.target.value)}
            >
              <option value="">-- Seleccionar Ambiente --</option>
              {ambientes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.codigo} - {a.nombre} ({a.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Día de la Semana *</label>
            <select
              className="form-select"
              value={dia}
              onChange={(e) => setDia(e.target.value as DayOfWeek)}
            >
              {DAYS_OF_WEEK.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Hora de Inicio *</label>
            <select
              className="form-select"
              value={horaInicio}
              onChange={(e) => setHoraInicio(Number(e.target.value))}
            >
              {Array.from({ length: 16 }, (_, i) => i + 6).map(h => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Duración (Horas) *</label>
            <select
              className="form-select"
              value={duracionHoras}
              onChange={(e) => setDuracionHoras(Number(e.target.value))}
            >
              <option value={1}>1 Hora (Termina a las {horaInicio + 1}:00)</option>
              <option value={2}>2 Horas (Termina a las {horaInicio + 2}:00)</option>
              <option value={3}>3 Horas (Termina a las {horaInicio + 3}:00)</option>
              <option value={4}>4 Horas (Termina a las {horaInicio + 4}:00)</option>
              <option value={5}>5 Horas (Termina a las {horaInicio + 5}:00)</option>
              <option value={6}>6 Horas (Termina a las {horaInicio + 6}:00)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones Adicionales</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Sesión práctica en laboratorio"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            <Check size={16} />
            {initialEntry ? 'Guardar Asignación' : 'Crear Asignación'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

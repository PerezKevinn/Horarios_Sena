import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Clock,
  AlertTriangle,
  Plus,
  Layers
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { HorarioEntry, DayOfWeek } from '../../types';
import { StatCard } from '../common/StatCard';
import { ScheduleGrid } from './ScheduleGrid';
import { ManualSlotEditorModal } from './ManualSlotEditorModal';

type ViewMode = 'all' | 'ficha' | 'instructor' | 'ambiente';

export const ScheduleView: React.FC = () => {
  const {
    horarios,
    instructores,
    fichas,
    ambientes,
    competencias,
    conflicts,
    stats,
    deleteHorarioSlot,
    moveHorarioSlot,
    setActiveTab,
  } = useSchedule();

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedFichaId, setSelectedFichaId] = useState<string>(fichas[0]?.id || '');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(instructores[0]?.id || '');
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>(ambientes[0]?.id || '');

  // Modal for adding / editing slots
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<HorarioEntry | null>(null);
  const [targetDay, setTargetDay] = useState<DayOfWeek>('Lunes');
  const [targetHour, setTargetHour] = useState<number>(6);

  // Filter schedules based on view mode
  const filteredHorarios = horarios.filter((h) => {
    if (viewMode === 'ficha' && selectedFichaId) {
      return h.fichaId === selectedFichaId;
    }
    if (viewMode === 'instructor' && selectedInstructorId) {
      return h.instructorId === selectedInstructorId;
    }
    if (viewMode === 'ambiente' && selectedAmbienteId) {
      return h.ambienteId === selectedAmbienteId;
    }
    return true; // 'all'
  });

  const handleEditSlot = (slot: HorarioEntry) => {
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const handleAddSlotAtCell = (dia: DayOfWeek, hora: number) => {
    setEditingSlot(null);
    setTargetDay(dia);
    setTargetHour(hora);
    setIsModalOpen(true);
  };

  const getFilterTitle = () => {
    if (viewMode === 'ficha') {
      const f = fichas.find((fi) => fi.id === selectedFichaId);
      return f ? `Horario de la Ficha: ${f.codigo} - ${f.nombrePrograma} (${f.jornada})` : 'Horario por Ficha';
    }
    if (viewMode === 'instructor') {
      const inst = instructores.find((i) => i.id === selectedInstructorId);
      return inst ? `Horario del Instructor: ${inst.nombre} (${inst.especialidad})` : 'Horario por Instructor';
    }
    if (viewMode === 'ambiente') {
      const amb = ambientes.find((a) => a.id === selectedAmbienteId);
      return amb ? `Ocupación de: ${amb.codigo} - ${amb.nombre} (${amb.sede})` : 'Horario por Ambiente';
    }
    return 'Matriz General de Horarios SENA';
  };

  return (
    <div className="scheduler-container animate-fade-in">
      {/* Printable Header (Visible only when printing) */}
      <div className="print-header">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#39A900', margin: 0 }}>
          SERVICIO NACIONAL DE APRENDIZAJE - SENA
        </h2>
        <h3 style={{ fontSize: '1.1rem', margin: '0.25rem 0' }}>{getFilterTitle()}</h3>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>
          Reporte generado automáticamente • Fecha: {new Date().toLocaleDateString('es-CO')}
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div className="stats-grid no-print">
        <StatCard
          label="Horas Programadas"
          value={`${stats.totalHorasProgramadas}h`}
          icon={<Clock size={22} />}
          color="green"
          helpText="Total semanal asignado"
        />
        <StatCard
          label="Fichas con Horario"
          value={`${stats.totalFichasProgramadas} / ${fichas.length}`}
          icon={<GraduationCap size={22} />}
          color="blue"
          helpText="Grupos activos"
        />
        <StatCard
          label="Instructores con Carga"
          value={`${stats.totalInstructoresConCarga} / ${instructores.length}`}
          icon={<Users size={22} />}
          color="purple"
          helpText="Docentes asignados"
        />
        <StatCard
          label="Ambientes en Uso"
          value={`${stats.totalAmbientesOcupados} / ${ambientes.length}`}
          icon={<Building2 size={22} />}
          color="amber"
          helpText="Espacios pedagógicos"
        />
        <div
          onClick={() => {
            if (conflicts.length > 0) setActiveTab('conflicts');
          }}
          style={{ cursor: conflicts.length > 0 ? 'pointer' : 'default' }}
        >
          <StatCard
            label="Conflictos Detectados"
            value={conflicts.length}
            icon={<AlertTriangle size={22} />}
            color={conflicts.length > 0 ? 'rose' : 'green'}
            helpText={conflicts.length > 0 ? 'Clic para diagnosticar' : '100% Sin colisiones'}
          />
        </div>
      </div>

      {/* Scheduler View Toolbar & Filter Modes */}
      <div className="scheduler-toolbar no-print">
        <div className="view-mode-tabs">
          <button
            className={`view-tab-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <Layers size={15} />
            <span>Matriz General</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'ficha' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('ficha');
              if (!selectedFichaId && fichas.length > 0) setSelectedFichaId(fichas[0].id);
            }}
          >
            <GraduationCap size={15} />
            <span>Por Ficha</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'instructor' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('instructor');
              if (!selectedInstructorId && instructores.length > 0) setSelectedInstructorId(instructores[0].id);
            }}
          >
            <Users size={15} />
            <span>Por Instructor</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'ambiente' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('ambiente');
              if (!selectedAmbienteId && ambientes.length > 0) setSelectedAmbienteId(ambientes[0].id);
            }}
          >
            <Building2 size={15} />
            <span>Por Ambiente</span>
          </button>
        </div>

        {/* Dynamic Filters depending on view mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {viewMode === 'ficha' && (
            <div className="filter-select-group">
              <label>Seleccionar Ficha:</label>
              <select
                className="form-select"
                value={selectedFichaId}
                onChange={(e) => setSelectedFichaId(e.target.value)}
                style={{ minWidth: '260px' }}
              >
                {fichas.map((f) => (
                  <option key={f.id} value={f.id}>
                    Ficha {f.codigo} - {f.nombrePrograma.slice(0, 30)} ({f.jornada})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'instructor' && (
            <div className="filter-select-group">
              <label>Seleccionar Instructor:</label>
              <select
                className="form-select"
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                style={{ minWidth: '260px' }}
              >
                {instructores.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} ({i.especialidad})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'ambiente' && (
            <div className="filter-select-group">
              <label>Seleccionar Ambiente:</label>
              <select
                className="form-select"
                value={selectedAmbienteId}
                onChange={(e) => setSelectedAmbienteId(e.target.value)}
                style={{ minWidth: '260px' }}
              >
                {ambientes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.codigo} - {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingSlot(null);
              setIsModalOpen(true);
            }}
            title="Asignar clase manualmente"
          >
            <Plus size={16} />
            <span>Asignar Clase</span>
          </button>
        </div>
      </div>

      {/* Main Timetable Matrix Grid */}
      <ScheduleGrid
        horarios={filteredHorarios}
        instructores={instructores}
        fichas={fichas}
        ambientes={ambientes}
        competencias={competencias}
        conflicts={conflicts}
        onEditSlot={handleEditSlot}
        onDeleteSlot={deleteHorarioSlot}
        onAddSlotAtCell={handleAddSlotAtCell}
        onMoveSlot={moveHorarioSlot}
      />

      {/* Manual Slot Editor Modal */}
      <ManualSlotEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialEntry={editingSlot}
        defaultDay={targetDay}
        defaultHour={targetHour}
      />
    </div>
  );
};

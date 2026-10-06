import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Clock,
  AlertTriangle,
  Plus,
  Layers,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';
import type { HorarioEntry, DayOfWeek } from '../../types';
import { ScheduleGrid, type DayDateInfo } from './ScheduleGrid';
import { ManualSlotEditorModal } from './ManualSlotEditorModal';
import { MonthlyScheduleView } from './MonthlyScheduleView';
import { AnnualPlanningView } from './AnnualPlanningView';
import { SenaDatePicker } from '../common/SenaDatePicker';

type ViewMode = 'all' | 'ficha' | 'instructor' | 'ambiente';

const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ScheduleView: React.FC = () => {
  const {
    horarios,
    instructores,
    fichas,
    ambientes,
    competencias,
    conflicts,
    stats,
    timeScale,
    setTimeScale,
    selectedDate,
    setSelectedDate,
    deleteHorarioSlot,
    moveHorarioSlot,
    setActiveTab,
  } = useSchedule();

  const { currentUser, isAdmin, isInstructor, currentInstructorId } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>(() => (isInstructor ? 'instructor' : 'all'));
  const [selectedFichaId, setSelectedFichaId] = useState<string>(fichas[0]?.id || '');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(() => (isInstructor && currentInstructorId ? currentInstructorId : (instructores[0]?.id || '')));
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>(ambientes[0]?.id || '');
  const [filterByDateValidity, setFilterByDateValidity] = useState<boolean>(false);

  useEffect(() => {
    if (isInstructor && currentInstructorId) {
      setViewMode('instructor');
      setSelectedInstructorId(currentInstructorId);
    }
  }, [isInstructor, currentInstructorId]);

  // Modal for adding / editing slots
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<HorarioEntry | null>(null);
  const [targetDay, setTargetDay] = useState<DayOfWeek>('Lunes');
  const [targetHour, setTargetHour] = useState<number>(6);

  // Calculate Monday of the selected week
  const getMondayOfDate = (dateStr: string): Date => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const day = date.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    } catch {
      return new Date();
    }
  };

  // Compute 6-day week dates (Monday to Saturday)
  const weekDates: DayDateInfo[] = useMemo(() => {
    const monday = getMondayOfDate(selectedDate);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return DAYS.map((dia, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = d.getDate();
      const dateStr = `${y}-${m}-${String(dayNum).padStart(2, '0')}`;

      return {
        dia,
        dateStr,
        dayNumber: dayNum,
        monthShort: MONTHS_SHORT[d.getMonth()],
        isToday: dateStr === todayStr,
      };
    });
  }, [selectedDate]);

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return '';
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];
    const [y, m] = selectedDate.split('-').map(Number);
    return `Semana: ${first.dayNumber} ${first.monthShort} al ${last.dayNumber} ${last.monthShort} ${y} • ${MONTHS_FULL[m - 1]}`;
  }, [weekDates, selectedDate]);

  const handlePrevWeek = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() - 7);
    const newY = curr.getFullYear();
    const newM = String(curr.getMonth() + 1).padStart(2, '0');
    const newD = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextWeek = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + 7);
    const newY = curr.getFullYear();
    const newM = String(curr.getMonth() + 1).padStart(2, '0');
    const newD = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Filter schedules based on view mode and optional date range validity
  const filteredHorarios = horarios.filter((h) => {
    if (viewMode === 'ficha' && selectedFichaId) {
      if (h.fichaId !== selectedFichaId) return false;
    }
    if (viewMode === 'instructor' && selectedInstructorId) {
      if (h.instructorId !== selectedInstructorId) return false;
    }
    if (viewMode === 'ambiente' && selectedAmbienteId) {
      if (h.ambienteId !== selectedAmbienteId) return false;
    }

    if (filterByDateValidity) {
      const mondayStr = weekDates[0]?.dateStr || selectedDate;
      const saturdayStr = weekDates[5]?.dateStr || selectedDate;

      const ficha = fichas.find((f) => f.id === h.fichaId);
      if (ficha?.fechaIngreso && saturdayStr < ficha.fechaIngreso) return false;
      if (ficha?.fechaSalida && mondayStr > ficha.fechaSalida) return false;

      const comp = competencias.find((c) => c.id === h.competenciaId);
      if (comp?.fechaInicio && saturdayStr < comp.fechaInicio) return false;
      if (comp?.fechaFin && mondayStr > comp.fechaFin) return false;
    }

    return true;
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
      if (!f) return 'Horario por Ficha';
      const fechasStr = (f.fechaIngreso || f.fechaSalida)
        ? ` • Periodo: ${f.fechaIngreso || 'N/D'} al ${f.fechaSalida || 'N/D'}`
        : '';
      return `Horario de la Ficha: ${f.codigo} - ${f.nombrePrograma} (${f.jornada})${fechasStr}`;
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

      {/* Modern, Clean & Unified Navigation Bar */}
      <div className="unified-control-bar no-print">
        {/* Left: Time Scale Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div className="time-scale-segmented">
            <button
              className={`time-scale-pill-btn ${timeScale === 'semanal' ? 'active' : ''}`}
              onClick={() => setTimeScale('semanal')}
            >
              <CalendarIcon size={14} />
              <span>Semanal</span>
            </button>
            <button
              className={`time-scale-pill-btn ${timeScale === 'mensual' ? 'active' : ''}`}
              onClick={() => setTimeScale('mensual')}
            >
              <CalendarDays size={14} />
              <span>Mensual</span>
            </button>
            <button
              className={`time-scale-pill-btn ${timeScale === 'anual' ? 'active' : ''}`}
              onClick={() => setTimeScale('anual')}
            >
              <CalendarRange size={14} />
              <span>Anual</span>
            </button>
          </div>

          {/* Date Picker & Week Navigation (When in Semanal) */}
          {timeScale === 'semanal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.28rem 0.45rem' }}
                  onClick={handlePrevWeek}
                  title="Semana anterior"
                >
                  <ChevronLeft size={15} />
                </button>

                <SenaDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  size="md"
                  showTodayShortcut={true}
                />

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.28rem 0.45rem' }}
                  onClick={handleNextWeek}
                  title="Semana siguiente"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleToday}
                style={{ fontSize: '0.74rem', padding: '0.32rem 0.6rem' }}
                title="Ir a la fecha actual de hoy"
              >
                Hoy
              </button>

              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                {weekRangeLabel}
              </span>
            </div>
          )}
        </div>

        {/* Right: Date Filter Validity Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {timeScale === 'semanal' && (
            <>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.74rem',
                  color: filterByDateValidity ? 'var(--sena-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: filterByDateValidity ? 'var(--sena-primary-light)' : 'transparent',
                  padding: '0.28rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: filterByDateValidity ? 'rgba(57, 169, 0, 0.3)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
                title="Si está activo, oculta clases cuyas fechas de ficha/competencia no estén vigentes en esta semana"
              >
                <input
                  type="checkbox"
                  checked={filterByDateValidity}
                  onChange={(e) => setFilterByDateValidity(e.target.checked)}
                />
                <Filter size={12} />
                <span>Solo vigentes en fecha</span>
              </label>

              {isAdmin ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingSlot(null);
                    setIsModalOpen(true);
                  }}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                >
                  <Plus size={14} />
                  <span>Asignar Clase</span>
                </button>
              ) : (
                <span className="badge badge-sena" style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}>
                  👨‍🏫 Instructor: {currentUser?.name || 'Docente'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compact, Delightful Stat Strip */}
      <div className="clean-stat-strip no-print">
        <div className="stat-strip-item">
          <Clock size={14} color="var(--sena-primary)" />
          <span><strong>{stats.totalHorasProgramadas}h</strong> semanales</span>
        </div>
        <div className="stat-strip-divider" />
        <div className="stat-strip-item">
          <GraduationCap size={14} color="var(--accent-blue)" />
          <span><strong>{stats.totalFichasProgramadas} / {fichas.length}</strong> Fichas activas</span>
        </div>
        <div className="stat-strip-divider" />
        <div className="stat-strip-item">
          <Users size={14} color="var(--accent-purple)" />
          <span><strong>{stats.totalInstructoresConCarga} / {instructores.length}</strong> Instructores</span>
        </div>
        <div className="stat-strip-divider" />
        <div className="stat-strip-item">
          <Building2 size={14} color="var(--accent-amber)" />
          <span><strong>{stats.totalAmbientesOcupados} / {ambientes.length}</strong> Ambientes</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="btn btn-secondary"
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.74rem',
              gap: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              borderColor: 'rgba(57, 169, 0, 0.4)',
              color: 'var(--text-main)',
              background: 'var(--bg-surface)'
            }}
            onClick={() => setActiveTab('cuadro-horas')}
            title="Ver Cuadro de Horas y Diferencias Horarias (Regla 80%)"
          >
            <BarChart3 size={13} color="var(--sena-primary)" />
            <span>Cuadro de Horas (80%)</span>
          </button>

          {conflicts.length > 0 ? (
            <button
              className="badge badge-rose"
              style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem' }}
              onClick={() => setActiveTab('conflicts')}
            >
              <AlertTriangle size={12} />
              <span>{conflicts.length} Conflictos detectados</span>
            </button>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--sena-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={13} />
              <span>Sin conflictos</span>
            </span>
          )}
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO ACTIVE TIME SCALE */}

      {/* 1. VISTA ANUAL */}
      {timeScale === 'anual' && <AnnualPlanningView />}

      {/* 2. VISTA MENSUAL */}
      {timeScale === 'mensual' && (
        <MonthlyScheduleView
          onSwitchToWeekly={() => setTimeScale('semanal')}
          onSelectSlot={handleEditSlot}
        />
      )}

      {/* 3. VISTA SEMANAL (WEEKLY MATRIX) */}
      {timeScale === 'semanal' && (
        <>
          {/* Filter Bar for Weekly Grid */}
          <div
            className="no-print"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            {/* View Mode Switcher */}
            <div className="view-mode-tabs" style={{ background: 'var(--bg-surface-elevated)', padding: '0.2rem' }}>
              <button
                className={`view-tab-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
              >
                <Layers size={13} />
                <span>Matriz General</span>
              </button>
              <button
                className={`view-tab-btn ${viewMode === 'ficha' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('ficha');
                  if (!selectedFichaId && fichas.length > 0) setSelectedFichaId(fichas[0].id);
                }}
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
              >
                <GraduationCap size={13} />
                <span>Por Ficha</span>
              </button>
              <button
                className={`view-tab-btn ${viewMode === 'instructor' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('instructor');
                  if (!selectedInstructorId && instructores.length > 0) setSelectedInstructorId(instructores[0].id);
                }}
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
              >
                <Users size={13} />
                <span>Por Instructor</span>
              </button>
              <button
                className={`view-tab-btn ${viewMode === 'ambiente' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('ambiente');
                  if (!selectedAmbienteId && ambientes.length > 0) setSelectedAmbienteId(ambientes[0].id);
                }}
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
              >
                <Building2 size={13} />
                <span>Por Ambiente</span>
              </button>
            </div>

            {/* Target Selector Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {viewMode === 'ficha' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ficha:</label>
                  <select
                    className="form-select"
                    value={selectedFichaId}
                    onChange={(e) => setSelectedFichaId(e.target.value)}
                    style={{ minWidth: '240px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
                  >
                    {fichas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.codigo} - {f.nombrePrograma.slice(0, 26)} ({f.jornada})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {viewMode === 'instructor' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Instructor:</label>
                  <select
                    className="form-select"
                    value={selectedInstructorId}
                    onChange={(e) => setSelectedInstructorId(e.target.value)}
                    style={{ minWidth: '240px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ambiente:</label>
                  <select
                    className="form-select"
                    value={selectedAmbienteId}
                    onChange={(e) => setSelectedAmbienteId(e.target.value)}
                    style={{ minWidth: '240px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
                  >
                    {ambientes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.codigo} - {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Main Timetable Matrix Grid with Week Date Headers */}
          <ScheduleGrid
            horarios={filteredHorarios}
            instructores={instructores}
            fichas={fichas}
            ambientes={ambientes}
            competencias={competencias}
            conflicts={conflicts}
            weekDates={weekDates}
            onEditSlot={handleEditSlot}
            onDeleteSlot={deleteHorarioSlot}
            onAddSlotAtCell={handleAddSlotAtCell}
            onMoveSlot={moveHorarioSlot}
          />
        </>
      )}

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

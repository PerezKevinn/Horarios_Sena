import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Users,
  Building2,
  Sparkles,
  Layers,
  Eye
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { HorarioEntry, DayOfWeek, Ficha, Competencia } from '../../types';
import { Modal } from '../common/Modal';
import { SenaDatePicker } from '../common/SenaDatePicker';

interface MonthlyScheduleViewProps {
  onSelectSlot?: (slot: HorarioEntry) => void;
  onSwitchToWeekly?: (date?: Date) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const DAY_INDEX_MAP: Record<number, DayOfWeek> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const MonthlyScheduleView: React.FC<MonthlyScheduleViewProps> = ({ onSwitchToWeekly }) => {
  const {
    horarios,
    fichas,
    instructores,
    ambientes,
    competencias,
    selectedDate,
    setSelectedDate,
  } = useSchedule();

  // Current year & month derived from selectedDate
  const currentDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, d || 1);
    } catch {
      // fallback
    }
    return new Date();
  }, [selectedDate]);

  const [filterMode, setFilterMode] = useState<'all' | 'ficha' | 'instructor' | 'ambiente'>('all');
  const [selectedFichaId, setSelectedFichaId] = useState<string>(fichas[0]?.id || '');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(instructores[0]?.id || '');
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>(ambientes[0]?.id || '');

  // Detail Modal for a specific day
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    dateStr: string;
    dayNum: number;
    dayName: string;
    slots: HorarioEntry[];
    startingComps: { comp: Competencia; ficha?: Ficha }[];
    endingComps: { comp: Competencia; ficha?: Ficha }[];
    startingFichas: Ficha[];
    endingFichas: Ficha[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    setSelectedDate(`${y}-${m}-01`);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    setSelectedDate(`${y}-${m}-01`);
  };

  // Filtered Horarios by selection
  const filteredHorarios = useMemo(() => {
    return horarios.filter(h => {
      if (filterMode === 'ficha' && selectedFichaId) return h.fichaId === selectedFichaId;
      if (filterMode === 'instructor' && selectedInstructorId) return h.instructorId === selectedInstructorId;
      if (filterMode === 'ambiente' && selectedAmbienteId) return h.ambienteId === selectedAmbienteId;
      return true;
    });
  }, [horarios, filterMode, selectedFichaId, selectedInstructorId, selectedAmbienteId]);

  // Generate Calendar Days Matrix
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const daysArray = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      daysArray.push({
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      daysArray.push({
        dayNumber: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month filler days to complete grid (multiples of 7)
    const remaining = 7 - (daysArray.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        daysArray.push({
          dayNumber: i,
          isCurrentMonth: false,
          date: new Date(year, month + 1, i),
        });
      }
    }

    return daysArray;
  }, [year, month]);

  // Compute monthly statistics
  const monthlyStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const activeFichas = fichas.filter(f => {
      if (!f.fechaIngreso && !f.fechaSalida) return true;
      const start = f.fechaIngreso || '0000-00-00';
      const end = f.fechaSalida || '9999-99-99';
      return start <= `${monthPrefix}-31` && end >= `${monthPrefix}-01`;
    });

    const activeComps = competencias.filter(c => {
      if (!c.fechaInicio && !c.fechaFin) return true;
      const start = c.fechaInicio || '0000-00-00';
      const end = c.fechaFin || '9999-99-99';
      return start <= `${monthPrefix}-31` && end >= `${monthPrefix}-01`;
    });

    const weeklyHours = filteredHorarios.reduce((sum, h) => sum + h.duracionHoras, 0);
    const estimatedMonthHours = Math.round(weeklyHours * 4.2);

    return {
      activeFichasCount: activeFichas.length,
      activeCompsCount: activeComps.length,
      estimatedMonthHours,
      weeklyHours
    };
  }, [year, month, fichas, competencias, filteredHorarios]);

  const getDayInfo = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayOfWeekIndex = date.getDay();
    const dayOfWeekName = DAY_INDEX_MAP[dayOfWeekIndex];

    if (!dayOfWeekName) {
      return {
        dateStr,
        daySlots: [],
        startingComps: [],
        endingComps: [],
        startingFichas: [],
        endingFichas: [],
        totalHours: 0
      };
    }

    const daySlots = filteredHorarios.filter(h => {
      if (h.dia !== dayOfWeekName) return false;
      const ficha = fichas.find(f => f.id === h.fichaId);
      if (ficha?.fechaIngreso && dateStr < ficha.fechaIngreso) return false;
      if (ficha?.fechaSalida && dateStr > ficha.fechaSalida) return false;

      const comp = competencias.find(c => c.id === h.competenciaId);
      if (comp?.fechaInicio && dateStr < comp.fechaInicio) return false;
      if (comp?.fechaFin && dateStr > comp.fechaFin) return false;

      return true;
    });

    const startingComps = competencias
      .filter(c => c.fechaInicio === dateStr)
      .map(c => ({ comp: c, ficha: fichas.find(f => f.id === c.fichaId) }));

    const endingComps = competencias
      .filter(c => c.fechaFin === dateStr)
      .map(c => ({ comp: c, ficha: fichas.find(f => f.id === c.fichaId) }));

    const startingFichas = fichas.filter(f => f.fechaIngreso === dateStr);
    const endingFichas = fichas.filter(f => f.fechaSalida === dateStr);

    const totalHours = daySlots.reduce((sum, h) => sum + h.duracionHoras, 0);

    return {
      dateStr,
      daySlots,
      startingComps,
      endingComps,
      startingFichas,
      endingFichas,
      totalHours
    };
  };

  const handleOpenDay = (date: Date, info: ReturnType<typeof getDayInfo>) => {
    const dayOfWeekIndex = date.getDay();
    const dayOfWeekName = DAY_INDEX_MAP[dayOfWeekIndex] || 'Domingo';
    setSelectedDayDetails({
      dateStr: info.dateStr,
      dayNum: date.getDate(),
      dayName: `${dayOfWeekName} ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`,
      slots: info.daySlots,
      startingComps: info.startingComps,
      endingComps: info.endingComps,
      startingFichas: info.startingFichas,
      endingFichas: info.endingFichas,
    });
  };

  return (
    <div className="monthly-calendar-container animate-fade-in">
      {/* Sleek, Single-Row Month Controls & Filter Toolbar */}
      <div
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
        {/* Month Navigator & Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '0.15rem', border: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.5rem', border: 'none', background: 'transparent' }}
              onClick={handlePrevMonth}
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ padding: '0 0.75rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--sena-primary)', minWidth: '150px', textAlign: 'center' }}>
              {MONTH_NAMES[month]} {year}
            </span>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.5rem', border: 'none', background: 'transparent' }}
              onClick={handleNextMonth}
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <SenaDatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            size="md"
            label="Ir a fecha:"
            showTodayShortcut={true}
          />

          <span className="badge badge-sena" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
            ~{monthlyStats.estimatedMonthHours}h ({monthlyStats.activeFichasCount} fichas)
          </span>
        </div>

        {/* Filter Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="view-mode-tabs" style={{ background: 'var(--bg-surface-elevated)', padding: '0.2rem' }}>
            <button
              className={`view-tab-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
              style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
            >
              <Layers size={13} />
              <span>Todo</span>
            </button>
            <button
              className={`view-tab-btn ${filterMode === 'ficha' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('ficha');
                if (!selectedFichaId && fichas.length > 0) setSelectedFichaId(fichas[0].id);
              }}
              style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
            >
              <GraduationCap size={13} />
              <span>Ficha</span>
            </button>
            <button
              className={`view-tab-btn ${filterMode === 'instructor' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('instructor');
                if (!selectedInstructorId && instructores.length > 0) setSelectedInstructorId(instructores[0].id);
              }}
              style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
            >
              <Users size={13} />
              <span>Instructor</span>
            </button>
            <button
              className={`view-tab-btn ${filterMode === 'ambiente' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('ambiente');
                if (!selectedAmbienteId && ambientes.length > 0) setSelectedAmbienteId(ambientes[0].id);
              }}
              style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
            >
              <Building2 size={13} />
              <span>Ambiente</span>
            </button>
          </div>

          {filterMode === 'ficha' && (
            <select
              className="form-select"
              value={selectedFichaId}
              onChange={(e) => setSelectedFichaId(e.target.value)}
              style={{ minWidth: '220px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
            >
              {fichas.map(f => (
                <option key={f.id} value={f.id}>
                  {f.codigo} - {f.nombrePrograma.slice(0, 24)}
                </option>
              ))}
            </select>
          )}

          {filterMode === 'instructor' && (
            <select
              className="form-select"
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              style={{ minWidth: '220px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
            >
              {instructores.map(i => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.especialidad})
                </option>
              ))}
            </select>
          )}

          {filterMode === 'ambiente' && (
            <select
              className="form-select"
              value={selectedAmbienteId}
              onChange={(e) => setSelectedAmbienteId(e.target.value)}
              style={{ minWidth: '220px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
            >
              {ambientes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.codigo} - {a.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Monthly Calendar Grid */}
      <div className="panel-card" style={{ padding: '0.85rem', background: 'var(--bg-card)', overflowX: 'auto' }}>
        <div style={{ minWidth: '920px' }}>
          {/* Day of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', marginBottom: '0.35rem' }}>
            {DAY_NAMES_HEADER.map((d, idx) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  padding: '0.5rem 0.35rem',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  color: idx === 5 || idx === 6 ? 'var(--text-dim)' : 'var(--sena-primary)',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
            {calendarDays.map((cell, idx) => {
              const info = getDayInfo(cell.date);
              const isToday =
                new Date().getDate() === cell.date.getDate() &&
                new Date().getMonth() === cell.date.getMonth() &&
                new Date().getFullYear() === cell.date.getFullYear();

              const hasMilestones =
                info.startingComps.length > 0 ||
                info.endingComps.length > 0 ||
                info.startingFichas.length > 0 ||
                info.endingFichas.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenDay(cell.date, info)}
                  style={{
                    minHeight: '110px',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-md)',
                    background: cell.isCurrentMonth
                      ? (isToday ? 'rgba(57, 169, 0, 0.08)' : 'var(--bg-surface)')
                      : 'var(--bg-surface-elevated)',
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    border: '1px solid',
                    borderColor: isToday
                      ? 'var(--sena-primary)'
                      : (cell.isCurrentMonth ? 'var(--border-subtle)' : 'transparent'),
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  className="monthly-day-cell"
                >
                  {/* Top Day Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: isToday ? 800 : 700,
                        color: isToday ? 'white' : 'var(--text-main)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isToday ? 'var(--sena-primary)' : 'transparent'
                      }}
                    >
                      {cell.dayNumber}
                    </span>

                    {info.totalHours > 0 && cell.isCurrentMonth && (
                      <span
                        className="badge badge-gray"
                        style={{ fontSize: '0.64rem', padding: '0.08rem 0.3rem', fontWeight: 700 }}
                      >
                        {info.totalHours}h
                      </span>
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', margin: '0.3rem 0', flex: 1, overflow: 'hidden' }}>
                    {/* Milestones Indicator */}
                    {hasMilestones && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.15rem' }}>
                        {info.startingComps.length > 0 && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              padding: '0.08rem 0.25rem',
                              borderRadius: '3px',
                              background: 'rgba(57, 169, 0, 0.2)',
                              color: 'var(--sena-primary)',
                              fontWeight: 700
                            }}
                            title={`Inician ${info.startingComps.length} competencias`}
                          >
                            🚀 {info.startingComps.length} Inicia
                          </span>
                        )}
                        {info.endingComps.length > 0 && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              padding: '0.08rem 0.25rem',
                              borderRadius: '3px',
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#f59e0b',
                              fontWeight: 700
                            }}
                            title={`Finalizan ${info.endingComps.length} competencias`}
                          >
                            🏁 {info.endingComps.length} Fin
                          </span>
                        )}
                        {info.startingFichas.length > 0 && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              padding: '0.08rem 0.25rem',
                              borderRadius: '3px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6',
                              fontWeight: 700
                            }}
                          >
                            🎓 {info.startingFichas.length} Ficha
                          </span>
                        )}
                      </div>
                    )}

                    {/* Classes summary chips */}
                    {info.daySlots.slice(0, 2).map((slot) => {
                      const ficha = fichas.find(f => f.id === slot.fichaId);
                      const inst = instructores.find(i => i.id === slot.instructorId);

                      return (
                        <div
                          key={slot.id}
                          className="calendar-pill-chip"
                          style={{ borderLeftColor: inst?.color || 'var(--sena-primary)' }}
                          title={`Ficha ${ficha?.codigo || ''} • ${slot.horaInicio}:00 (${slot.duracionHoras}h)`}
                        >
                          <strong>{slot.horaInicio}:00</strong> F.{ficha?.codigo || ''} ({slot.duracionHoras}h)
                        </div>
                      );
                    })}

                    {info.daySlots.length > 2 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'right', fontWeight: 700 }}>
                        +{info.daySlots.length - 2} más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDayDetails && (
        <Modal
          isOpen={!!selectedDayDetails}
          onClose={() => setSelectedDayDetails(null)}
          title={`Detalle de Formación: ${selectedDayDetails.dayName}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              {onSwitchToWeekly && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const [y, m, d] = selectedDayDetails.dateStr.split('-').map(Number);
                    setSelectedDate(selectedDayDetails.dateStr);
                    onSwitchToWeekly(new Date(y, m - 1, d));
                    setSelectedDayDetails(null);
                  }}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Eye size={14} />
                  <span>Ver en Matriz Semanal</span>
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setSelectedDayDetails(null)} style={{ marginLeft: 'auto' }}>
                Cerrar
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Day Milestones */}
            {(selectedDayDetails.startingComps.length > 0 ||
              selectedDayDetails.endingComps.length > 0 ||
              selectedDayDetails.startingFichas.length > 0 ||
              selectedDayDetails.endingFichas.length > 0) && (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--sena-primary)' }}>
                  <Sparkles size={15} />
                  <span>Hitos Calendario SENA ({selectedDayDetails.dateStr})</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  {selectedDayDetails.startingComps.map(({ comp, ficha }) => (
                    <div key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-sena" style={{ fontSize: '0.68rem' }}>🚀 Inicia Competencia</span>
                      <span><strong>Comp. {comp.codigo}</strong> - {comp.nombre} (Ficha {ficha?.codigo || ''})</span>
                    </div>
                  ))}

                  {selectedDayDetails.endingComps.map(({ comp, ficha }) => (
                    <div key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>🏁 Finaliza Competencia</span>
                      <span><strong>Comp. {comp.codigo}</strong> - {comp.nombre} (Ficha {ficha?.codigo || ''})</span>
                    </div>
                  ))}

                  {selectedDayDetails.startingFichas.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>🎓 Ingreso Ficha</span>
                      <span>Ficha {f.codigo} - {f.nombrePrograma} ({f.jornada})</span>
                    </div>
                  ))}

                  {selectedDayDetails.endingFichas.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>🏁 Fin Etapa Lectiva</span>
                      <span>Ficha {f.codigo} - {f.nombrePrograma}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day Scheduled Classes Timeline */}
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="var(--sena-primary)" />
                <span>Sesiones Programadas ({selectedDayDetails.slots.length})</span>
              </h4>

              {selectedDayDetails.slots.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                  No hay clases programadas para este día con los filtros activos.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {selectedDayDetails.slots
                    .sort((a, b) => a.horaInicio - b.horaInicio)
                    .map((slot) => {
                      const ficha = fichas.find(f => f.id === slot.fichaId);
                      const inst = instructores.find(i => i.id === slot.instructorId);
                      const amb = ambientes.find(a => a.id === slot.ambienteId);
                      const comp = competencias.find(c => c.id === slot.competenciaId);

                      return (
                        <div
                          key={slot.id}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: `4px solid ${inst?.color || 'var(--sena-primary)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--sena-primary)' }}>
                              Ficha {ficha?.codigo} - {ficha?.nombrePrograma}
                            </span>
                            <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                              {slot.horaInicio}:00 - {slot.horaInicio + slot.duracionHoras}:00 ({slot.duracionHoras}h)
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {comp?.nombre || 'Competencia de formación'}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Users size={13} color={inst?.color} />
                              <span>{inst?.nombre}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Building2 size={13} color="var(--accent-cyan)" />
                              <span>{amb?.codigo} - {amb?.nombre} ({amb?.sede})</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

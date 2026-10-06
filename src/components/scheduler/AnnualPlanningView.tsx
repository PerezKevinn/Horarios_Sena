import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  Building2,
  Download,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  Clock,
  BookOpen
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { DayOfWeek } from '../../types';
import { Modal } from '../common/Modal';
import { SenaDatePicker } from '../common/SenaDatePicker';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MINI_DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const DAY_INDEX_MAP: Record<number, DayOfWeek> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const AnnualPlanningView: React.FC = () => {
  const {
    fichas,
    instructores,
    ambientes,
    competencias,
    horarios,
    selectedDate,
    setSelectedDate,
    setTimeScale,
  } = useSchedule();

  const selectedYear = useMemo(() => {
    try {
      const y = parseInt(selectedDate.split('-')[0], 10);
      if (y && !isNaN(y)) return y;
    } catch {
      // fallback
    }
    return new Date().getFullYear();
  }, [selectedDate]);

  const [filterMode, setFilterMode] = useState<'all' | 'ficha' | 'instructor' | 'ambiente'>('all');
  const [selectedFichaId, setSelectedFichaId] = useState<string>(fichas[0]?.id || '');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(instructores[0]?.id || '');
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>(ambientes[0]?.id || '');
  const [selectedTrimester, setSelectedTrimester] = useState<'all' | 'T1' | 'T2' | 'T3' | 'T4'>('all');

  // Month / Day Inspector Modal
  const [inspectMonth, setInspectMonth] = useState<number | null>(null);

  const handlePrevYear = () => {
    setSelectedDate(`${selectedYear - 1}-01-01`);
  };

  const handleNextYear = () => {
    setSelectedDate(`${selectedYear + 1}-01-01`);
  };

  // Filtered Horarios
  const filteredHorarios = useMemo(() => {
    return horarios.filter(h => {
      if (filterMode === 'ficha' && selectedFichaId) return h.fichaId === selectedFichaId;
      if (filterMode === 'instructor' && selectedInstructorId) return h.instructorId === selectedInstructorId;
      if (filterMode === 'ambiente' && selectedAmbienteId) return h.ambienteId === selectedAmbienteId;
      return true;
    });
  }, [horarios, filterMode, selectedFichaId, selectedInstructorId, selectedAmbienteId]);

  // Generate calendar days for each of the 12 months
  const monthsData = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return Array.from({ length: 12 }, (_, monthIdx) => {
      const firstDay = new Date(selectedYear, monthIdx, 1);
      const lastDay = new Date(selectedYear, monthIdx + 1, 0);
      const totalDays = lastDay.getDate();
      const monthPrefix = `${selectedYear}-${String(monthIdx + 1).padStart(2, '0')}`;

      // Trim classification: T1 (0,1,2), T2 (3,4,5), T3 (6,7,8), T4 (9,10,11)
      const trimester = monthIdx < 3 ? 'T1' : monthIdx < 6 ? 'T2' : monthIdx < 9 ? 'T3' : 'T4';

      let startingDayOfWeek = firstDay.getDay() - 1;
      if (startingDayOfWeek === -1) startingDayOfWeek = 6;

      const daysArray = [];

      // Prev month filler
      const prevMonthLastDay = new Date(selectedYear, monthIdx, 0).getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        daysArray.push({
          dayNumber: prevMonthLastDay - i,
          isCurrentMonth: false,
          dateStr: '',
          hasClasses: false,
          isToday: false,
          hasStart: false,
          hasEnd: false,
        });
      }

      // Current month days
      let monthTotalClassDays = 0;
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
        const dayOfWeekIndex = new Date(selectedYear, monthIdx, day).getDay();
        const dayName = DAY_INDEX_MAP[dayOfWeekIndex];

        let hasClasses = false;
        if (dayName) {
          const matchingSlots = filteredHorarios.filter(h => {
            if (h.dia !== dayName) return false;
            const ficha = fichas.find(f => f.id === h.fichaId);
            if (ficha?.fechaIngreso && dateStr < ficha.fechaIngreso) return false;
            if (ficha?.fechaSalida && dateStr > ficha.fechaSalida) return false;

            const comp = competencias.find(c => c.id === h.competenciaId);
            if (comp?.fechaInicio && dateStr < comp.fechaInicio) return false;
            if (comp?.fechaFin && dateStr > comp.fechaFin) return false;
            return true;
          });
          hasClasses = matchingSlots.length > 0;
          if (hasClasses) monthTotalClassDays++;
        }

        const hasStart = competencias.some(c => c.fechaInicio === dateStr) || fichas.some(f => f.fechaIngreso === dateStr);
        const hasEnd = competencias.some(c => c.fechaFin === dateStr) || fichas.some(f => f.fechaSalida === dateStr);

        daysArray.push({
          dayNumber: day,
          isCurrentMonth: true,
          dateStr,
          hasClasses,
          isToday: dateStr === todayStr,
          hasStart,
          hasEnd,
        });
      }

      // Next month filler
      const remaining = 7 - (daysArray.length % 7);
      if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
          daysArray.push({
            dayNumber: i,
            isCurrentMonth: false,
            dateStr: '',
            hasClasses: false,
            isToday: false,
            hasStart: false,
            hasEnd: false,
          });
        }
      }

      // Fichas & Competencias active in this month
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
      const estimatedHours = Math.round(weeklyHours * 4.2);

      return {
        monthIndex: monthIdx,
        monthName: MONTH_NAMES[monthIdx],
        trimester,
        days: daysArray,
        activeFichasCount: activeFichas.length,
        activeCompsCount: activeComps.length,
        estimatedHours,
        totalClassDays: monthTotalClassDays
      };
    });
  }, [selectedYear, filteredHorarios, fichas, competencias]);

  // Visible months based on trimester filter
  const visibleMonths = useMemo(() => {
    if (selectedTrimester === 'all') return monthsData;
    return monthsData.filter(m => m.trimester === selectedTrimester);
  }, [monthsData, selectedTrimester]);

  // Annual Overview Stats
  const annualSummary = useMemo(() => {
    const weeklyHours = filteredHorarios.reduce((sum, h) => sum + h.duracionHoras, 0);
    const estimatedAnnualHours = Math.round(weeklyHours * 44);

    return {
      estimatedAnnualHours,
      totalFichas: fichas.length,
      totalComps: competencias.length,
      totalInstructores: instructores.length,
      totalAmbientes: ambientes.length,
    };
  }, [filteredHorarios, fichas, competencias, instructores, ambientes]);

  // Export Annual Plan to CSV
  const handleExportAnnualCSV = () => {
    const headers = [
      'Año Planeación',
      'Código Ficha',
      'Programa de Formación',
      'Jornada',
      'Trimestre',
      'Fecha Ingreso',
      'Fecha Salida',
      'Código Competencia',
      'Nombre Competencia',
      'Fecha Inicio',
      'Fecha Fin',
      'Horas Semanales',
      'Instructor Responsable'
    ];

    const rows: string[] = [];
    fichas.forEach(f => {
      const fComps = competencias.filter(c => c.fichaId === f.id);
      if (fComps.length === 0) {
        rows.push([
          selectedYear,
          f.codigo,
          `"${f.nombrePrograma}"`,
          f.jornada,
          f.trimestre,
          f.fechaIngreso || '',
          f.fechaSalida || '',
          '',
          '',
          '',
          '',
          '',
          ''
        ].join(';'));
      } else {
        fComps.forEach(c => {
          const inst = instructores.find(i => i.id === c.instructorId);
          rows.push([
            selectedYear,
            f.codigo,
            `"${f.nombrePrograma}"`,
            f.jornada,
            f.trimestre,
            f.fechaIngreso || '',
            f.fechaSalida || '',
            c.codigo,
            `"${c.nombre}"`,
            c.fechaInicio || '',
            c.fechaFin || '',
            c.horasSemanales,
            inst ? `"${inst.nombre}"` : 'Sin asignar'
          ].join(';'));
        });
      }
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Planeacion_Anual_12Meses_SENA_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenMonthInCalendar = (monthIdx: number) => {
    const mStr = String(monthIdx + 1).padStart(2, '0');
    setSelectedDate(`${selectedYear}-${mStr}-01`);
    setTimeScale('mensual');
  };

  return (
    <div className="annual-planning-container animate-fade-in">
      {/* Top Controls Bar */}
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
        {/* Left: Year Navigator & Quick Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '0.15rem', border: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.5rem', border: 'none', background: 'transparent' }}
              onClick={handlePrevYear}
              title="Año anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ padding: '0 0.75rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--sena-primary)', minWidth: '70px', textAlign: 'center' }}>
              {selectedYear}
            </span>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.5rem', border: 'none', background: 'transparent' }}
              onClick={handleNextYear}
              title="Año siguiente"
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

          {/* Trimester Switcher */}
          <div className="view-mode-tabs" style={{ background: 'var(--bg-surface-elevated)', padding: '0.2rem' }}>
            <button
              className={`view-tab-btn ${selectedTrimester === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTrimester('all')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <span>12 Meses</span>
            </button>
            <button
              className={`view-tab-btn ${selectedTrimester === 'T1' ? 'active' : ''}`}
              onClick={() => setSelectedTrimester('T1')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <span>T1 (Ene-Mar)</span>
            </button>
            <button
              className={`view-tab-btn ${selectedTrimester === 'T2' ? 'active' : ''}`}
              onClick={() => setSelectedTrimester('T2')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <span>T2 (Abr-Jun)</span>
            </button>
            <button
              className={`view-tab-btn ${selectedTrimester === 'T3' ? 'active' : ''}`}
              onClick={() => setSelectedTrimester('T3')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <span>T3 (Jul-Sep)</span>
            </button>
            <button
              className={`view-tab-btn ${selectedTrimester === 'T4' ? 'active' : ''}`}
              onClick={() => setSelectedTrimester('T4')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <span>T4 (Oct-Dic)</span>
            </button>
          </div>
        </div>

        {/* Right: Target Filters & Export */}
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
              style={{ minWidth: '200px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
            >
              {fichas.map(f => (
                <option key={f.id} value={f.id}>
                  {f.codigo} - {f.nombrePrograma.slice(0, 22)}
                </option>
              ))}
            </select>
          )}

          {filterMode === 'instructor' && (
            <select
              className="form-select"
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              style={{ minWidth: '200px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
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
              style={{ minWidth: '200px', fontSize: '0.8rem', padding: '0.32rem 0.6rem' }}
            >
              {ambientes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.codigo} - {a.nombre}
                </option>
              ))}
            </select>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleExportAnnualCSV}
            title="Descargar reporte anual en CSV"
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
          >
            <Download size={13} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Annual KPI Stat Strip & Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.55rem 1.15rem',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} color="var(--sena-primary)" />
            <span><strong>~{annualSummary.estimatedAnnualHours.toLocaleString()}h</strong> proyectadas</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <GraduationCap size={14} color="var(--accent-blue)" />
            <span><strong>{annualSummary.totalFichas}</strong> Fichas</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={14} color="var(--accent-purple)" />
            <span><strong>{annualSummary.totalComps}</strong> Competencias</span>
          </div>
        </div>

        {/* Visual Map Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.74rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(57, 169, 0, 0.3)' }} />
            <span>Día con clases</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sena-primary)' }} />
            <span>🚀 Inicia</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
            <span>🏁 Finaliza</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sena-primary)', boxShadow: '0 0 4px var(--sena-primary-glow)' }} />
            <span>Hoy</span>
          </span>
        </div>
      </div>

      {/* 12 Mini-Months Grid Board */}
      <div className="annual-months-grid">
        {visibleMonths.map((m) => (
          <div
            key={m.monthIndex}
            className={`mini-month-card ${m.trimester.toLowerCase()}`}
          >
            {/* Header: Month Name, Trimester Tag, and Quick Action */}
            <div className="mini-month-header">
              <div
                className="mini-month-title"
                onClick={() => setInspectMonth(m.monthIndex)}
                title={`Ver detalles de ${m.monthName}`}
              >
                <span>{m.monthName}</span>
                <span className="badge badge-gray" style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem' }}>
                  {m.trimester}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="mini-month-badge" title="Horas estimadas y fichas activas">
                  {m.estimatedHours}h • {m.activeFichasCount}F
                </span>

                <button
                  className="btn-icon"
                  style={{ padding: '0.15rem' }}
                  onClick={() => handleOpenMonthInCalendar(m.monthIndex)}
                  title={`Abrir ${m.monthName} en vista mensual completa`}
                >
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="mini-days-header-row">
              {MINI_DAY_HEADERS.map((dh, i) => (
                <div key={i} style={{ color: i >= 5 ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                  {dh}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="mini-days-grid">
              {m.days.map((d, dIdx) => (
                <div
                  key={dIdx}
                  className={`mini-day-cell ${!d.isCurrentMonth ? 'other-month' : ''} ${d.hasClasses ? 'has-classes' : ''} ${d.isToday ? 'is-today' : ''}`}
                  onClick={() => {
                    if (d.isCurrentMonth) {
                      setInspectMonth(m.monthIndex);
                    }
                  }}
                  title={d.isCurrentMonth ? `${d.dateStr}: ${d.hasClasses ? 'Sesión programada' : 'Sin clase'}` : undefined}
                >
                  <span>{d.dayNumber}</span>
                  {d.hasStart && <span className="mini-day-dot start" title="Inicia competencia o ficha" />}
                  {d.hasEnd && !d.hasStart && <span className="mini-day-dot end" title="Finaliza competencia o ficha" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Month Detailed Inspector Modal */}
      {inspectMonth !== null && (
        <Modal
          isOpen={inspectMonth !== null}
          onClose={() => setInspectMonth(null)}
          title={`Planificación Anual: ${MONTH_NAMES[inspectMonth]} ${selectedYear}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  handleOpenMonthInCalendar(inspectMonth);
                  setInspectMonth(null);
                }}
              >
                <Calendar size={14} />
                <span>Abrir en Calendario Mensual</span>
              </button>
              <button className="btn btn-primary" onClick={() => setInspectMonth(null)}>
                Cerrar
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Month Summary KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Carga Mensual</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--sena-primary)' }}>
                  ~{monthsData[inspectMonth]?.estimatedHours}h
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Fichas Activas</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  {monthsData[inspectMonth]?.activeFichasCount} Grupos
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Competencias</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                  {monthsData[inspectMonth]?.activeCompsCount} Activas
                </div>
              </div>
            </div>

            {/* Milestones in this Month */}
            {(() => {
              const monthPrefix = `${selectedYear}-${String(inspectMonth + 1).padStart(2, '0')}`;
              const startingComps = competencias.filter(c => c.fechaInicio && c.fechaInicio.startsWith(monthPrefix));
              const endingComps = competencias.filter(c => c.fechaFin && c.fechaFin.startsWith(monthPrefix));
              const startingFichas = fichas.filter(f => f.fechaIngreso && f.fechaIngreso.startsWith(monthPrefix));
              const endingFichas = fichas.filter(f => f.fechaSalida && f.fechaSalida.startsWith(monthPrefix));

              const hasMilestones = startingComps.length > 0 || endingComps.length > 0 || startingFichas.length > 0 || endingFichas.length > 0;

              return hasMilestones ? (
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sena-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} />
                    <span>Hitos SENA en {MONTH_NAMES[inspectMonth]}</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                    {startingComps.map(c => (
                      <div key={c.id}>🚀 <strong>{c.fechaInicio}:</strong> Inicia Comp. {c.codigo} ({c.nombre})</div>
                    ))}
                    {endingComps.map(c => (
                      <div key={c.id}>🏁 <strong>{c.fechaFin}:</strong> Finaliza Comp. {c.codigo} ({c.nombre})</div>
                    ))}
                    {startingFichas.map(f => (
                      <div key={f.id}>🎓 <strong>{f.fechaIngreso}:</strong> Ingreso Ficha {f.codigo} - {f.nombrePrograma}</div>
                    ))}
                    {endingFichas.map(f => (
                      <div key={f.id}>🏁 <strong>{f.fechaSalida}:</strong> Fin Etapa Ficha {f.codigo}</div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Active Fichas List in this month */}
            <div>
              <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Fichas en Formación durante {MONTH_NAMES[inspectMonth]}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {fichas
                  .filter(f => {
                    const monthPrefix = `${selectedYear}-${String(inspectMonth + 1).padStart(2, '0')}`;
                    const start = f.fechaIngreso || '0000-00-00';
                    const end = f.fechaSalida || '9999-99-99';
                    return start <= `${monthPrefix}-31` && end >= `${monthPrefix}-01`;
                  })
                  .map(f => {
                    const fComps = competencias.filter(c => c.fichaId === f.id);
                    return (
                      <div
                        key={f.id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.6rem 0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--sena-primary)' }}>
                              Ficha {f.codigo}
                            </strong>
                            <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{f.jornada}</span>
                            <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>Trim. {f.trimestre}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '0.1rem' }}>
                            {f.nombrePrograma}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <div>{fComps.length} competencias</div>
                          <div>{f.fechaIngreso || 'N/D'} al {f.fechaSalida || 'N/D'}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

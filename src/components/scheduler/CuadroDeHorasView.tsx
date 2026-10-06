import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const CuadroDeHorasView: React.FC = () => {
  const {
    instructores,
    fichas,
    ambientes,
    competencias,
    horarios,
    setActiveTab,
  } = useSchedule();

  const { isInstructor, currentInstructorId } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'instructores' | 'fichas' | 'ambientes'>('instructores');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVinculacion, setFilterVinculacion] = useState<'all' | 'Planta' | 'Contratista'>('all');
  const [filterEstado, setFilterEstado] = useState<'all' | 'optimo' | 'disponible' | 'sobrecarga'>('all');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const toggleExpandRow = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedRowIds(new Set(instructores.map(i => i.id)));
  const collapseAll = () => setExpandedRowIds(new Set());

  // 1. CÁLCULO DE CARGA DOCENTE (REGLA 80% SENA)
  const instructoresCarga = useMemo(() => {
    return instructores.map((inst) => {
      const isPlanta = inst.vinculacion === 'Planta';
      const jornadaTotal = 40; // 40h jornada laboral estándar
      // Para instructores de planta: 80% (32h) formación directa + 20% (8h) complementarias
      // Para contratistas: su maxHorasSemanales (hasta 40h) es formación directa
      const metaFormacionDirecta = isPlanta ? 32 : (inst.maxHorasSemanales || 40);
      const horasComplementarias = isPlanta ? 8 : 0;

      // Horas asignadas en la matriz de horarios actual
      const slotsInst = horarios.filter(h => h.instructorId === inst.id);
      const horasAsignadas = slotsInst.reduce((sum, h) => sum + h.duracionHoras, 0);

      // Diferencia horaria: asignadas vs meta 80%
      const diferenciaHoras = horasAsignadas - metaFormacionDirecta;
      const porcentajeCumplimiento = Math.round((horasAsignadas / metaFormacionDirecta) * 100);

      let estado: 'optimo' | 'disponible' | 'sobrecarga' = 'optimo';
      if (horasAsignadas < metaFormacionDirecta) estado = 'disponible';
      else if (horasAsignadas > metaFormacionDirecta) estado = 'sobrecarga';

      // Fichas y competencias asignadas al instructor
      const fichasAsignadas = Array.from(new Set(slotsInst.map(s => s.fichaId)))
        .map(fId => fichas.find(f => f.id === fId))
        .filter(Boolean) as typeof fichas;

      const competenciasInst = competencias.filter(c => c.instructorId === inst.id);

      return {
        ...inst,
        jornadaTotal,
        metaFormacionDirecta,
        horasComplementarias,
        horasAsignadas,
        diferenciaHoras,
        porcentajeCumplimiento,
        estado,
        slotsCount: slotsInst.length,
        fichasAsignadas,
        competenciasInst,
      };
    });
  }, [instructores, horarios, fichas, competencias]);

  // Filtro de instructores
  const filteredInstructores = useMemo(() => {
    return instructoresCarga.filter(i => {
      const matchSearch =
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.documento.includes(searchTerm);

      const matchVinc = filterVinculacion === 'all' || i.vinculacion === filterVinculacion;
      const matchEst = filterEstado === 'all' || i.estado === filterEstado;

      return matchSearch && matchVinc && matchEst;
    });
  }, [instructoresCarga, searchTerm, filterVinculacion, filterEstado]);

  // 2. CÁLCULO DE HORAS POR FICHA Y MALLA
  const fichasCarga = useMemo(() => {
    return fichas.map(ficha => {
      const comps = competencias.filter(c => c.fichaId === ficha.id);
      const horasMallaRequeridas = comps.reduce((sum, c) => sum + c.horasSemanales, 0);

      const slotsFicha = horarios.filter(h => h.fichaId === ficha.id);
      const horasProgramadas = slotsFicha.reduce((sum, h) => sum + h.duracionHoras, 0);

      const diferenciaHoras = horasProgramadas - horasMallaRequeridas;
      const porcentajeCobertura = horasMallaRequeridas > 0
        ? Math.round((horasProgramadas / horasMallaRequeridas) * 100)
        : 100;

      return {
        ...ficha,
        competenciasList: comps,
        horasMallaRequeridas,
        horasProgramadas,
        diferenciaHoras,
        porcentajeCobertura,
        slotsCount: slotsFicha.length
      };
    });
  }, [fichas, competencias, horarios]);

  // 3. CÁLCULO DE OCUPACIÓN DE AMBIENTES
  const ambientesCarga = useMemo(() => {
    return ambientes.map(amb => {
      const slotsAmb = horarios.filter(h => h.ambienteId === amb.id);
      const horasOcupadas = slotsAmb.reduce((sum, h) => sum + h.duracionHoras, 0);
      // Capacidad máxima de uso semanal estándar: 60 horas (12h x 5 días)
      const horasDisponiblesSemanales = 60;
      const porcentajeOcupacion = Math.round((horasOcupadas / horasDisponiblesSemanales) * 100);

      return {
        ...amb,
        horasOcupadas,
        horasDisponiblesSemanales,
        porcentajeOcupacion,
        slotsCount: slotsAmb.length
      };
    });
  }, [ambientes, horarios]);

  // Resumen Global de Carga
  const summaryStats = useMemo(() => {
    const totalHorasProgramadas = instructoresCarga.reduce((sum, i) => sum + i.horasAsignadas, 0);
    const totalMetaDirecta = instructoresCarga.reduce((sum, i) => sum + i.metaFormacionDirecta, 0);
    const totalOptimos = instructoresCarga.filter(i => i.estado === 'optimo').length;
    const totalDisponibles = instructoresCarga.filter(i => i.estado === 'disponible').length;
    const totalSobrecarga = instructoresCarga.filter(i => i.estado === 'sobrecarga').length;

    return {
      totalHorasProgramadas,
      totalMetaDirecta,
      totalOptimos,
      totalDisponibles,
      totalSobrecarga,
    };
  }, [instructoresCarga]);

  // Exportar Cuadro de Horas a CSV
  const handleExportCSV = () => {
    const headers = [
      'Documento',
      'Instructor',
      'Especialidad',
      'Tipo Vinculación',
      'Jornada Total (Sem)',
      'Meta Formación Directa 80% (Sem)',
      'Actividades Complementarias 20% (Sem)',
      'Horas Programadas (Sem)',
      'Diferencia Horaria (+/-)',
      '% Cumplimiento Formación Directa',
      'Estado Carga',
      'Total Fichas Asignadas'
    ];

    const rows = instructoresCarga.map(i => [
      i.documento,
      `"${i.nombre}"`,
      `"${i.especialidad}"`,
      i.vinculacion,
      `${i.jornadaTotal}h`,
      `${i.metaFormacionDirecta}h`,
      `${i.horasComplementarias}h`,
      `${i.horasAsignadas}h`,
      `${i.diferenciaHoras > 0 ? '+' : ''}${i.diferenciaHoras}h`,
      `${i.porcentajeCumplimiento}%`,
      i.estado === 'optimo' ? 'Óptimo (100%)' : i.estado === 'disponible' ? 'Horas Disponibles' : 'Sobrecarga',
      i.fichasAsignadas.length
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cuadro_Horas_Diferencias_80_SENA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cuadro-horas-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Banner: Explicación de la Regla del 80% */}
      <div
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #39A900 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 14px var(--sena-primary-glow)'
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Cuadro de Horas & Control de Carga (Regla 80% SENA)
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Monitoreo de Formación Directa vs Actividades Complementarias y balance de diferencias horarias.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleExportCSV}
              title="Descargar Cuadro de Horas en CSV/Excel"
            >
              <Download size={15} />
              <span>Exportar Cuadro de Horas</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('schedule')}
            >
              <Calendar size={15} />
              <span>Ver en Horario</span>
            </button>
          </div>
        </div>

        {/* Institutional 80/20 Rule Notice */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-main)'
          }}
        >
          <Info size={18} color="var(--sena-primary)" style={{ flexShrink: 0 }} />
          <div>
            <strong>Normativa Institucional SENA (80% / 20%):</strong> Los instructores de planta con jornada de 40h semanales deben cumplir <strong>32 horas de Formación Directa (80%)</strong> frente a aprendices y <strong>8 horas (20%)</strong> en actividades complementarias (preparación, evaluación y planeación).
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Formación Directa Programada</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sena-primary)', marginTop: '0.2rem' }}>
              {summaryStats.totalHorasProgramadas}h / {summaryStats.totalMetaDirecta}h
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Carga semanal consolidada</div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Carga Exacta (100% Meta 80%)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
              {summaryStats.totalOptimos} Docentes
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Asignación completa sin déficit</div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Con Horas Disponibles (&lt;80%)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
              {summaryStats.totalDisponibles} Docentes
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Capacidad libre para programar</div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Con Sobrecarga (&gt;80%)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: summaryStats.totalSobrecarga > 0 ? '#f43f5e' : 'var(--text-dim)', marginTop: '0.2rem' }}>
              {summaryStats.totalSobrecarga} Docentes
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Superan el tope legal/contractual</div>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="view-mode-tabs">
            <button
              className={`view-tab-btn ${activeSubTab === 'instructores' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('instructores')}
            >
              <Users size={14} />
              <span>Carga Docente (Regla 80%)</span>
            </button>
            <button
              className={`view-tab-btn ${activeSubTab === 'fichas' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('fichas')}
            >
              <GraduationCap size={14} />
              <span>Horas por Ficha & Malla</span>
            </button>
            <button
              className={`view-tab-btn ${activeSubTab === 'ambientes' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('ambientes')}
            >
              <Building2 size={14} />
              <span>Ocupación de Ambientes</span>
            </button>
          </div>

          {/* Filters for Instructors Subtab */}
          {activeSubTab === 'instructores' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="search-input-wrapper" style={{ minWidth: '200px' }}>
                <Search className="search-icon" size={13} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar docente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '0.32rem 0.6rem 0.32rem 1.8rem' }}
                />
              </div>

              <select
                className="form-select"
                value={filterVinculacion}
                onChange={(e) => setFilterVinculacion(e.target.value as any)}
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.6rem' }}
              >
                <option value="all">Todas las Vinculaciones</option>
                <option value="Planta">Planta (Meta 32h / 80%)</option>
                <option value="Contratista">Contratista (Hasta 40h)</option>
              </select>

              <select
                className="form-select"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.6rem' }}
              >
                <option value="all">Todos los Estados</option>
                <option value="optimo">Carga Exacta (100%)</option>
                <option value="disponible">Con Horas Libres (&lt;80%)</option>
                <option value="sobrecarga">Con Sobrecarga (&gt;80%)</option>
              </select>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.74rem', padding: '0.32rem 0.55rem' }}
                onClick={expandAll}
              >
                Expandir
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.74rem', padding: '0.32rem 0.55rem' }}
                onClick={collapseAll}
              >
                Contraer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUBTAB 1: CONTROL DE CARGA DOCENTE (REGLA 80%) */}
      {activeSubTab === 'instructores' && (
        <div className="panel-card" style={{ padding: '1rem', background: 'var(--bg-card)', overflowX: 'auto' }}>
          <div style={{ minWidth: '1050px' }} className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '36px' }}></th>
                  <th>Instructor / Especialidad</th>
                  <th>Vinculación</th>
                  <th>Jornada Total</th>
                  <th>Meta 80% (Directa)</th>
                  <th>20% Complementarias</th>
                  <th>Horas Asignadas</th>
                  <th>Diferencia Horaria</th>
                  <th>% Cumplimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructores.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron instructores con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredInstructores.map(inst => {
                    const isExpanded = expandedRowIds.has(inst.id);
                    const isMe = isInstructor && currentInstructorId === inst.id;
                    return (
                      <React.Fragment key={inst.id}>
                        <tr style={{ background: isMe ? 'rgba(57, 169, 0, 0.08)' : (isExpanded ? 'rgba(57, 169, 0, 0.03)' : undefined), borderLeft: isMe ? '3px solid var(--sena-primary)' : undefined }}>
                          <td>
                            <button
                              className="btn-icon"
                              style={{ padding: '0.15rem' }}
                              onClick={() => toggleExpandRow(inst.id)}
                              title={isExpanded ? 'Ocultar fichas asignadas' : 'Ver fichas y competencias asignadas'}
                            >
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: inst.color, flexShrink: 0 }} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <strong style={{ color: 'var(--text-main)' }}>{inst.nombre}</strong>
                                  {isMe && <span className="badge badge-sena" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>Tú</span>}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Doc: {inst.documento} • {inst.especialidad}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge variant={inst.vinculacion === 'Planta' ? 'sena' : 'blue'}>
                              {inst.vinculacion}
                            </Badge>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{inst.jornadaTotal}h / sem</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--sena-primary)' }}>{inst.metaFormacionDirecta}h</strong>
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-muted)' }}>{inst.horasComplementarias}h</span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                              {inst.horasAsignadas}h
                            </strong>
                          </td>
                          <td>
                            {inst.diferenciaHoras === 0 ? (
                              <span className="badge badge-sena" style={{ fontSize: '0.7rem' }}>
                                <CheckCircle2 size={11} style={{ marginRight: '2px' }} />
                                Exacto (0h)
                              </span>
                            ) : inst.diferenciaHoras < 0 ? (
                              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                {inst.diferenciaHoras}h libres
                              </span>
                            ) : (
                              <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                                <AlertTriangle size={11} style={{ marginRight: '2px' }} />
                                +{inst.diferenciaHoras}h exceso
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{ width: '70px', height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, inst.porcentajeCumplimiento)}%`,
                                    background: inst.estado === 'sobrecarga'
                                      ? '#f43f5e'
                                      : inst.estado === 'optimo'
                                      ? 'var(--sena-primary)'
                                      : 'var(--accent-blue)',
                                    borderRadius: '999px'
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.75rem', minWidth: '35px' }}>
                                {inst.porcentajeCumplimiento}%
                              </span>
                            </div>
                          </td>
                          <td>
                            {inst.estado === 'optimo' && (
                              <span style={{ color: 'var(--sena-primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                                ✓ Carga Óptima
                              </span>
                            )}
                            {inst.estado === 'disponible' && (
                              <span style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.75rem' }}>
                                Disponible ({Math.abs(inst.diferenciaHoras)}h)
                              </span>
                            )}
                            {inst.estado === 'sobrecarga' && (
                              <span style={{ color: '#f43f5e', fontWeight: 700, fontSize: '0.75rem' }}>
                                ⚠ Sobrecarga (+{inst.diferenciaHoras}h)
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Breakdown */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Layers size={14} color="var(--sena-primary)" />
                                  <span>Fichas y Sesiones Asignadas a {inst.nombre} ({inst.horasAsignadas}h totales):</span>
                                </div>

                                {inst.fichasAsignadas.length === 0 ? (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Este instructor no tiene clases programadas actualmente en la matriz semanal.
                                  </div>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
                                    {inst.fichasAsignadas.map(f => {
                                      const slotsForFicha = horarios.filter(h => h.instructorId === inst.id && h.fichaId === f.id);
                                      const horasFicha = slotsForFicha.reduce((sum, h) => sum + h.duracionHoras, 0);

                                      return (
                                        <div
                                          key={f.id}
                                          style={{
                                            background: 'var(--bg-surface)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '0.5rem 0.75rem'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                                            <strong style={{ fontSize: '0.8rem', color: 'var(--sena-primary)' }}>
                                              Ficha {f.codigo}
                                            </strong>
                                            <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>
                                              {horasFicha}h / sem
                                            </span>
                                          </div>
                                          <div style={{ fontSize: '0.73rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                                            {f.nombrePrograma} ({f.jornada})
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HORAS POR FICHA & MALLA */}
      {activeSubTab === 'fichas' && (
        <div className="panel-card" style={{ padding: '1rem', background: 'var(--bg-card)', overflowX: 'auto' }}>
          <div style={{ minWidth: '950px' }} className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Ficha / Programa</th>
                  <th>Jornada</th>
                  <th>Trimestre</th>
                  <th>Horas Malla Requeridas</th>
                  <th>Horas Programadas</th>
                  <th>Diferencia Horaria</th>
                  <th>% Cobertura</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {fichasCarga.map(ficha => (
                  <tr key={ficha.id}>
                    <td>
                      <div>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--sena-primary)' }}>
                          Ficha {ficha.codigo}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>{ficha.nombrePrograma}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="blue">{ficha.jornada}</Badge>
                    </td>
                    <td>
                      <span className="badge badge-gray">Trim. {ficha.trimestre}</span>
                    </td>
                    <td>
                      <strong>{ficha.horasMallaRequeridas}h / sem</strong>
                    </td>
                    <td>
                      <strong style={{ color: ficha.horasProgramadas >= ficha.horasMallaRequeridas ? 'var(--sena-primary)' : 'var(--accent-amber)' }}>
                        {ficha.horasProgramadas}h / sem
                      </strong>
                    </td>
                    <td>
                      {ficha.diferenciaHoras === 0 ? (
                        <span className="badge badge-sena" style={{ fontSize: '0.7rem' }}>Completo (0h)</span>
                      ) : ficha.diferenciaHoras < 0 ? (
                        <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>{ficha.diferenciaHoras}h faltantes</span>
                      ) : (
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>+{ficha.diferenciaHoras}h adicionales</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '60px', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, ficha.porcentajeCobertura)}%`,
                              background: ficha.porcentajeCobertura >= 100 ? 'var(--sena-primary)' : '#f59e0b',
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          {ficha.porcentajeCobertura}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {ficha.porcentajeCobertura >= 100 ? (
                        <span style={{ color: 'var(--sena-primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                          ✓ Malla Cubierta
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.75rem' }}>
                          Pendiente ({ficha.horasMallaRequeridas - ficha.horasProgramadas}h)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: OCUPACIÓN DE AMBIENTES */}
      {activeSubTab === 'ambientes' && (
        <div className="panel-card" style={{ padding: '1rem', background: 'var(--bg-card)', overflowX: 'auto' }}>
          <div style={{ minWidth: '950px' }} className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Ambiente / Sede</th>
                  <th>Tipo</th>
                  <th>Capacidad</th>
                  <th>Horas Ocupadas (Sem)</th>
                  <th>Capacidad Disponible (Sem)</th>
                  <th>% Ocupación</th>
                </tr>
              </thead>
              <tbody>
                {ambientesCarga.map(amb => (
                  <tr key={amb.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{amb.codigo}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{amb.nombre} ({amb.sede})</div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{amb.tipo}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{amb.capacidad} aprendices</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--sena-primary)' }}>{amb.horasOcupadas}h / sem</strong>
                    </td>
                    <td>
                      <span>{amb.horasDisponiblesSemanales}h / sem</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '70px', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, amb.porcentajeOcupacion)}%`,
                              background: amb.porcentajeOcupacion > 80 ? '#f59e0b' : 'var(--accent-blue)',
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          {amb.porcentajeOcupacion}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  GraduationCap,
  Sparkles,
  Info,
  Calendar,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { Programa, CompetenciaPlantilla } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const ProgramaManager: React.FC = () => {
  const {
    programas,
    addPrograma,
    updatePrograma,
    deletePrograma,
    addCompetenciaToPrograma,
    updateCompetenciaInPrograma,
    deleteCompetenciaFromPrograma,
    instructores,
    ambientes,
    fichas,
    setActiveTab,
  } = useSchedule();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(programas[0]?.id || null);

  // Modal Program State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Programa | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [nivelFormacion, setNivelFormacion] = useState<Programa['nivelFormacion']>('Tecnólogo');
  const [duracionMeses, setDuracionMeses] = useState(24);
  const [descripcion, setDescripcion] = useState('');
  const [programComps, setProgramComps] = useState<CompetenciaPlantilla[]>([]);

  // Modal Competency Template State
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [targetProgramId, setTargetProgramId] = useState<string>('');
  const [editingComp, setEditingComp] = useState<CompetenciaPlantilla | null>(null);
  const [compCodigo, setCompCodigo] = useState('');
  const [compNombre, setCompNombre] = useState('');
  const [compRAP, setCompRAP] = useState('');
  const [compHorasSemanales, setCompHorasSemanales] = useState(8);
  const [compHorasTotales, setCompHorasTotales] = useState(96);
  const [compBloqueMinimo, setCompBloqueMinimo] = useState(2);
  const [compFechaInicio, setCompFechaInicio] = useState('');
  const [compFechaFin, setCompFechaFin] = useState('');
  const [compInstructorSugerido, setCompInstructorSugerido] = useState('');
  const [compAmbienteSugerido, setCompAmbienteSugerido] = useState('');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No definida';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const openAddProgramModal = () => {
    setEditingProgram(null);
    setCodigo('');
    setNombre('');
    setNivelFormacion('Tecnólogo');
    setDuracionMeses(24);
    setDescripcion('');
    setProgramComps([]);
    setIsProgramModalOpen(true);
  };

  const openEditProgramModal = (prog: Programa) => {
    setEditingProgram(prog);
    setCodigo(prog.codigo);
    setNombre(prog.nombre);
    setNivelFormacion(prog.nivelFormacion);
    setDuracionMeses(prog.duracionMeses || 24);
    setDescripcion(prog.descripcion || '');
    setProgramComps([...(prog.competencias || [])]);
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      alert('Por favor ingresa el código y nombre del programa.');
      return;
    }

    const payload = {
      codigo,
      nombre,
      nivelFormacion,
      duracionMeses: Number(duracionMeses),
      descripcion,
      competencias: programComps,
    };

    if (editingProgram) {
      updatePrograma(editingProgram.id, payload);
    } else {
      addPrograma(payload);
    }

    setIsProgramModalOpen(false);
  };

  const openAddCompModal = (progId: string) => {
    setTargetProgramId(progId);
    setEditingComp(null);
    setCompCodigo('');
    setCompNombre('');
    setCompRAP('');
    setCompHorasSemanales(8);
    setCompHorasTotales(96);
    setCompBloqueMinimo(2);
    setCompFechaInicio('');
    setCompFechaFin('');
    setCompInstructorSugerido(instructores[0]?.id || '');
    setCompAmbienteSugerido(ambientes[0]?.id || '');
    setIsCompModalOpen(true);
  };

  const openEditCompModal = (progId: string, comp: CompetenciaPlantilla) => {
    setTargetProgramId(progId);
    setEditingComp(comp);
    setCompCodigo(comp.codigo);
    setCompNombre(comp.nombre);
    setCompRAP(comp.resultadoAprendizaje || '');
    setCompHorasSemanales(comp.horasSemanales);
    setCompHorasTotales(comp.horasTotales);
    setCompBloqueMinimo(comp.bloqueMinimoHoras || 2);
    setCompFechaInicio(comp.fechaInicio || '');
    setCompFechaFin(comp.fechaFin || '');
    setCompInstructorSugerido(comp.instructorIdSugerido || '');
    setCompAmbienteSugerido(comp.ambienteIdSugerido || '');
    setIsCompModalOpen(true);
  };

  const handleSaveCompetencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compCodigo.trim() || !compNombre.trim()) {
      alert('Por favor completa el código y nombre de la competencia.');
      return;
    }

    const compPayload = {
      codigo: compCodigo,
      nombre: compNombre,
      resultadoAprendizaje: compRAP,
      horasSemanales: Number(compHorasSemanales),
      horasTotales: Number(compHorasTotales),
      bloqueMinimoHoras: Number(compBloqueMinimo),
      fechaInicio: compFechaInicio || undefined,
      fechaFin: compFechaFin || undefined,
      instructorIdSugerido: compInstructorSugerido || undefined,
      ambienteIdSugerido: compAmbienteSugerido || undefined,
    };

    if (targetProgramId === 'temp') {
      const newTempComp: CompetenciaPlantilla = {
        id: `comp-temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...compPayload
      };
      setProgramComps(prev => [...prev, newTempComp]);
      setIsCompModalOpen(false);
      return;
    }

    if (editingComp) {
      updateCompetenciaInPrograma(targetProgramId, editingComp.id, compPayload);
      setProgramComps(prev => prev.map(c => c.id === editingComp.id ? { ...c, ...compPayload } : c));
    } else {
      addCompetenciaToPrograma(targetProgramId, compPayload);
      const newCompWithId: CompetenciaPlantilla = {
        id: `comp-plantilla-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...compPayload
      };
      setProgramComps(prev => [...prev, newCompWithId]);
    }

    setIsCompModalOpen(false);
  };

  const filteredProgramas = programas.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.includes(searchTerm) ||
    p.nivelFormacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedProgramId(prev => prev === id ? null : id);
  };

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Programas de Formación y Malla Curricular</h2>
          <p>
            Define los programas del SENA con su catálogo de competencias asociadas. Al registrar una Ficha y elegir un programa, sus competencias se cargarán automáticamente.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddProgramModal}>
          <Plus size={16} />
          <span>Nuevo Programa</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar programa por código, nombre o nivel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List of Programs with Collapsible Competencies */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredProgramas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Layers size={32} />
            </div>
            <div className="empty-title">No hay programas de formación registrados</div>
            <div className="empty-desc">
              Crea un nuevo programa de formación con sus competencias para cargarlas automáticamente al crear fichas.
            </div>
            <button className="btn btn-primary" onClick={openAddProgramModal} style={{ marginTop: '0.5rem' }}>
              <Plus size={16} />
              <span>Registrar Primer Programa</span>
            </button>
          </div>
        ) : (
          filteredProgramas.map((prog) => {
            const isExpanded = expandedProgramId === prog.id;
            const associatedFichas = fichas.filter(f => f.programaId === prog.id || f.nombrePrograma.includes(prog.nombre));
            const totalWeeklyHours = (prog.competencias || []).reduce((sum, c) => sum + c.horasSemanales, 0);

            return (
              <div
                key={prog.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Program Card Header */}
                <div
                  style={{
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(57, 169, 0, 0.05)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                  onClick={() => toggleExpand(prog.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(57, 169, 0, 0.15)',
                        color: 'var(--sena-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--sena-primary)' }}>
                          [{prog.codigo}]
                        </strong>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {prog.nombre}
                        </span>
                        <Badge variant="blue">{prog.nivelFormacion}</Badge>
                        {prog.duracionMeses && (
                          <span className="badge badge-gray">{prog.duracionMeses} Meses</span>
                        )}
                      </div>

                      {prog.descripcion && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: 1.3 }}>
                          {prog.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{prog.competencias?.length || 0}</strong> competencias
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                        {totalWeeklyHours}h semanales • {associatedFichas.length} fichas
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className="btn-icon"
                        onClick={() => openAddCompModal(prog.id)}
                        title="Agregar competencia al programa"
                        style={{ color: 'var(--sena-primary)' }}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => openEditProgramModal(prog)}
                        title="Editar información del programa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          if (confirm(`¿Eliminar el programa "${prog.nombre}"?`)) {
                            deletePrograma(prog.id);
                          }
                        }}
                        title="Eliminar programa"
                        style={{ color: '#f43f5e' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={() => toggleExpand(prog.id)}
                      title={isExpanded ? 'Contraer competencias' : 'Ver competencias'}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Competencies Section */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Sparkles size={15} color="var(--sena-primary)" />
                        <span>Malla Curricular ({prog.competencias?.length || 0} Competencias Template)</span>
                      </div>

                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                        onClick={() => openAddCompModal(prog.id)}
                      >
                        <Plus size={13} />
                        <span>Agregar Competencia</span>
                      </button>
                    </div>

                    {(!prog.competencias || prog.competencias.length === 0) ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Este programa aún no tiene competencias registradas. Haz clic en "Agregar Competencia" para crearlas.
                      </div>
                    ) : (
                      <div className="data-table-container">
                        <table className="data-table" style={{ fontSize: '0.82rem' }}>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Nombre de la Competencia / RAP</th>
                              <th>Periodo (Inicio / Fin)</th>
                              <th>Horas Sem.</th>
                              <th>Horas Totales</th>
                              <th>Bloque Mín.</th>
                              <th>Instructor Sugerido</th>
                              <th>Ambiente Sugerido</th>
                              <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prog.competencias.map((comp) => {
                              const suggestedInst = instructores.find(i => i.id === comp.instructorIdSugerido);
                              const suggestedAmb = ambientes.find(a => a.id === comp.ambienteIdSugerido);

                              return (
                                <tr key={comp.id}>
                                  <td>
                                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
                                      {comp.codigo}
                                    </strong>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600 }}>{comp.nombre}</div>
                                    {comp.resultadoAprendizaje && (
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                        RAP: {comp.resultadoAprendizaje}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.74rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-main)' }} title="Fecha de Inicio">
                                        <Calendar size={12} color="var(--sena-primary)" />
                                        <span><strong>Inicio:</strong> {formatDate(comp.fechaInicio)}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }} title="Fecha de Finalización">
                                        <CalendarCheck size={12} color="#f59e0b" />
                                        <span><strong>Fin:</strong> {formatDate(comp.fechaFin)}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                      {comp.horasSemanales}h / sem
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ color: 'var(--text-dim)' }}>
                                      {comp.horasTotales}h
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge badge-gray">
                                      {comp.bloqueMinimoHoras || 2}h
                                    </span>
                                  </td>
                                  <td>
                                    {suggestedInst ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: suggestedInst.color }} />
                                        <span>{suggestedInst.nombre.slice(0, 22)}...</span>
                                      </div>
                                    ) : (
                                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Sin asignar</span>
                                    )}
                                  </td>
                                  <td>
                                    {suggestedAmb ? (
                                      <span className="badge badge-gray">{suggestedAmb.codigo}</span>
                                    ) : (
                                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Cualquiera</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                                      <button
                                        className="btn-icon"
                                        onClick={() => openEditCompModal(prog.id, comp)}
                                        title="Editar competencia plantilla"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        className="btn-icon"
                                        onClick={() => {
                                          if (confirm(`¿Eliminar la competencia ${comp.codigo} del programa?`)) {
                                            deleteCompetenciaFromPrograma(prog.id, comp.id);
                                          }
                                        }}
                                        title="Eliminar competencia"
                                        style={{ color: '#f43f5e' }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setActiveTab('fichas')}
                      >
                        <GraduationCap size={14} />
                        <span>Ver Fichas de Formación</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Crear / Editar Programa */}
      <Modal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        title={editingProgram ? 'Editar Programa de Formación' : 'Registrar Nuevo Programa de Formación'}
      >
        <form onSubmit={handleSaveProgram} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código del Programa *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. 228106"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nivel de Formación</label>
              <select
                className="form-select"
                value={nivelFormacion}
                onChange={(e) => setNivelFormacion(e.target.value as any)}
              >
                <option value="Tecnólogo">Tecnólogo</option>
                <option value="Técnico">Técnico</option>
                <option value="Especialización Tecnológica">Especialización Tecnológica</option>
                <option value="Operario">Operario</option>
                <option value="Auxiliar">Auxiliar</option>
                <option value="Curso Corto">Curso Corto</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del Programa de Formación *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Ej. Tecnólogo en Análisis y Desarrollo de Software (ADSO)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duración Estimada (Meses)</label>
              <input
                type="number"
                min={1}
                max={48}
                className="form-input"
                value={duracionMeses}
                onChange={(e) => setDuracionMeses(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción o Perfil Ocupacional</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Desarrollo backend, frontend, bases de datos y metodologías ágiles"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          {/* Competencias del Programa en el modal */}
          <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                <Sparkles size={15} color="var(--sena-primary)" />
                <span>Malla Curricular / Competencias del Programa ({programComps.length})</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => {
                  setTargetProgramId(editingProgram ? editingProgram.id : 'temp');
                  setEditingComp(null);
                  setCompCodigo('');
                  setCompNombre('');
                  setCompRAP('');
                  setCompHorasSemanales(8);
                  setCompHorasTotales(96);
                  setCompBloqueMinimo(2);
                  setCompInstructorSugerido(instructores[0]?.id || '');
                  setCompAmbienteSugerido(ambientes[0]?.id || '');
                  setIsCompModalOpen(true);
                }}
              >
                <Plus size={13} />
                <span>+ Agregar Competencia</span>
              </button>
            </div>

            {programComps.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Aún no has añadido competencias a este programa. Puedes agregarlas ahora o editarlas en cualquier momento desde la lista de programas.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {programComps.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', flexShrink: 0 }}>
                        {c.codigo}
                      </strong>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.nombre}
                      </span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', flexShrink: 0 }}>
                        ({c.horasSemanales}h/sem)
                      </span>
                      {c.fechaInicio && c.fechaFin && (
                        <span style={{ color: 'var(--sena-primary)', fontSize: '0.68rem', flexShrink: 0 }}>
                          [{formatDate(c.fechaInicio)} - {formatDate(c.fechaFin)}]
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ color: '#f43f5e', padding: '0.2rem', flexShrink: 0 }}
                      onClick={() => {
                        setProgramComps(programComps.filter((_, i) => i !== idx));
                      }}
                      title="Quitar competencia"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProgramModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <BookOpen size={16} />
              {editingProgram ? 'Guardar Cambios' : 'Registrar Programa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Crear / Editar Competencia Plantilla del Programa */}
      <Modal
        isOpen={isCompModalOpen}
        onClose={() => setIsCompModalOpen(false)}
        title={editingComp ? 'Editar Competencia del Programa' : 'Agregar Competencia a la Malla Curricular'}
      >
        <form onSubmit={handleSaveCompetencia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="alert-banner" style={{ background: 'rgba(57, 169, 0, 0.08)', border: '1px solid rgba(57, 169, 0, 0.25)', color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
            <Info size={16} color="var(--sena-primary)" />
            <div style={{ fontSize: '0.8rem' }}>
              Esta competencia servirá como plantilla. Cuando crees una Ficha de este programa, se cargará automáticamente para sus horarios con estas fechas y horas.
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código de Competencia *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. 220501096"
                value={compCodigo}
                onChange={(e) => setCompCodigo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horas Semanales *</label>
              <input
                type="number"
                min={1}
                max={40}
                className="form-input"
                required
                value={compHorasSemanales}
                onChange={(e) => setCompHorasSemanales(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre Completo de la Competencia *</label>
            <textarea
              className="form-textarea"
              required
              rows={2}
              placeholder="Ej. Desarrollar la solución de software de acuerdo con el diseño y metodologías de desarrollo"
              value={compNombre}
              onChange={(e) => setCompNombre(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resultado de Aprendizaje Principal (RAP)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Construir el backend y servicios REST aplicando patrones arquitectónicos"
              value={compRAP}
              onChange={(e) => setCompRAP(e.target.value)}
            />
          </div>

          {/* Fechas de Inicio y Finalización de la Competencia */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de Inicio de la Competencia</label>
              <input
                type="date"
                className="form-input"
                value={compFechaInicio}
                onChange={(e) => setCompFechaInicio(e.target.value)}
              />
              <span className="form-help">Inicio estimado de esta competencia</span>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Finalización de la Competencia</label>
              <input
                type="date"
                className="form-input"
                value={compFechaFin}
                onChange={(e) => setCompFechaFin(e.target.value)}
              />
              <span className="form-help">Finalización o entrega de resultados</span>
            </div>
          </div>

          {compFechaInicio && compFechaFin && compFechaFin < compFechaInicio && (
            <div className="alert-banner warning" style={{ padding: '0.6rem 0.85rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.8rem' }}>
                Atención: La fecha de finalización es anterior a la fecha de inicio.
              </span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Instructor Sugerido</label>
              <select
                className="form-select"
                value={compInstructorSugerido}
                onChange={(e) => setCompInstructorSugerido(e.target.value)}
              >
                <option value="">-- Por Asignar al Crear la Ficha --</option>
                {instructores.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} ({i.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ambiente Sugerido</label>
              <select
                className="form-select"
                value={compAmbienteSugerido}
                onChange={(e) => setCompAmbienteSugerido(e.target.value)}
              >
                <option value="">Cualquier ambiente disponible</option>
                {ambientes.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.codigo} - {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Horas Totales del Trimestre</label>
              <input
                type="number"
                min={1}
                max={400}
                className="form-input"
                value={compHorasTotales}
                onChange={(e) => setCompHorasTotales(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bloque Mínimo por Sesión</label>
              <select
                className="form-select"
                value={compBloqueMinimo}
                onChange={(e) => setCompBloqueMinimo(Number(e.target.value))}
              >
                <option value={2}>Bloques de 2 Horas</option>
                <option value={3}>Bloques de 3 Horas</option>
                <option value={4}>Bloques de 4 Horas</option>
                <option value={5}>Bloques de 5 Horas</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCompModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <BookOpen size={16} />
              {editingComp ? 'Guardar Cambios' : 'Agregar Competencia'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

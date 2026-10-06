import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  GraduationCap,
  Users,
  Calendar,
  CalendarCheck,
  AlertCircle,
  Sparkles,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { Ficha, JornadaType, DayOfWeek } from '../../types';
import { JORNADA_CONFIG, DAYS_OF_WEEK } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const FichaManager: React.FC = () => {
  const {
    fichas,
    programas,
    addFicha,
    updateFicha,
    deleteFicha,
    reloadCompetenciasForFicha,
    competencias,
    horarios,
    setActiveTab,
  } = useSchedule();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null);

  // Form state
  const [programaId, setProgramaId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombrePrograma, setNombrePrograma] = useState('');
  const [nivelFormacion, setNivelFormacion] = useState<Ficha['nivelFormacion']>('Tecnólogo');
  const [jornada, setJornada] = useState<JornadaType>('Mañana');
  const [trimestre, setTrimestre] = useState(1);
  const [totalAprendices, setTotalAprendices] = useState(30);
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [sede, setSede] = useState('Centro de Teleinformática y Producción');
  const [diasFormacion, setDiasFormacion] = useState<DayOfWeek[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);

  const handleProgramSelection = (selectedProgId: string) => {
    setProgramaId(selectedProgId);
    if (selectedProgId === 'custom') {
      return;
    }
    const prog = programas.find(p => p.id === selectedProgId);
    if (prog) {
      setNombrePrograma(prog.nombre);
      setNivelFormacion(prog.nivelFormacion);
    }
  };

  const openAddModal = () => {
    setEditingFicha(null);
    const defaultProg = programas[0];
    if (defaultProg) {
      setProgramaId(defaultProg.id);
      setNombrePrograma(defaultProg.nombre);
      setNivelFormacion(defaultProg.nivelFormacion);
    } else {
      setProgramaId('custom');
      setNombrePrograma('');
      setNivelFormacion('Tecnólogo');
    }
    setCodigo('');
    setJornada('Mañana');
    setTrimestre(1);
    setTotalAprendices(30);
    setFechaIngreso('');
    setFechaSalida('');
    setSede('Centro de Teleinformática y Producción');
    setDiasFormacion(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setIsModalOpen(true);
  };

  const openEditModal = (ficha: Ficha) => {
    setEditingFicha(ficha);
    setProgramaId(ficha.programaId || 'custom');
    setCodigo(ficha.codigo);
    setNombrePrograma(ficha.nombrePrograma);
    setNivelFormacion(ficha.nivelFormacion);
    setJornada(ficha.jornada);
    setTrimestre(ficha.trimestre);
    setTotalAprendices(ficha.totalAprendices);
    setFechaIngreso(ficha.fechaIngreso || '');
    setFechaSalida(ficha.fechaSalida || '');
    setSede(ficha.sede || '');
    setDiasFormacion(ficha.diasFormacion || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombrePrograma.trim()) {
      alert('Por favor completa el código de ficha y nombre del programa.');
      return;
    }

    const payload = {
      codigo,
      programaId: programaId !== 'custom' ? programaId : undefined,
      nombrePrograma,
      nivelFormacion,
      jornada,
      trimestre: Number(trimestre),
      totalAprendices: Number(totalAprendices),
      fechaIngreso: fechaIngreso || undefined,
      fechaSalida: fechaSalida || undefined,
      sede,
      diasFormacion,
    };

    if (editingFicha) {
      updateFicha(editingFicha.id, payload);
    } else {
      addFicha(payload, true);
    }

    setIsModalOpen(false);
  };

  const toggleDay = (day: DayOfWeek) => {
    if (diasFormacion.includes(day)) {
      setDiasFormacion(diasFormacion.filter(d => d !== day));
    } else {
      setDiasFormacion([...diasFormacion, day]);
    }
  };

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

  const filteredFichas = fichas.filter(f =>
    f.codigo.includes(searchTerm) ||
    f.nombrePrograma.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.jornada.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.fechaIngreso && f.fechaIngreso.includes(searchTerm)) ||
    (f.fechaSalida && f.fechaSalida.includes(searchTerm))
  );

  const getJornadaBadgeVariant = (j: JornadaType) => {
    switch (j) {
      case 'Mañana': return 'sena';
      case 'Tarde': return 'amber';
      case 'Noche': return 'purple';
      case 'Fin de Semana': return 'blue';
      default: return 'gray';
    }
  };

  const selectedProgramObj = programas.find(p => p.id === programaId);

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Gestión de Fichas de Formación</h2>
          <p>
            Administra las fichas activas, jornadas, fechas de ingreso/salida y carga automática de competencias desde los programas de formación.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('programas')}>
            <BookOpen size={16} />
            <span>Ver Programas ({programas.length})</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Nueva Ficha</span>
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código de ficha, programa, jornada o fecha (YYYY-MM-DD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código Ficha</th>
              <th>Programa de Formación Base</th>
              <th>Nivel</th>
              <th>Jornada & Horario</th>
              <th>Trimestre</th>
              <th>Periodo (Ingreso / Salida)</th>
              <th>Aprendices</th>
              <th>Competencias Asignadas</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredFichas.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron fichas registradas.
                </td>
              </tr>
            ) : (
              filteredFichas.map((ficha) => {
                const fichaComps = competencias.filter(c => c.fichaId === ficha.id);
                const fichaHoras = horarios.filter(h => h.fichaId === ficha.id).reduce((s, h) => s + h.duracionHoras, 0);
                const baseProg = programas.find(p => p.id === ficha.programaId);

                return (
                  <tr key={ficha.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--sena-primary)' }}>
                        {ficha.codigo}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-word' }}>
                        {ficha.nombrePrograma}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                        {baseProg && (
                          <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                            Prog. {baseProg.codigo}
                          </span>
                        )}
                        {ficha.sede && (
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            {ficha.sede}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="blue">{ficha.nivelFormacion}</Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <Badge variant={getJornadaBadgeVariant(ficha.jornada)}>
                          {ficha.jornada} ({JORNADA_CONFIG[ficha.jornada]?.label})
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">Trimestre {ficha.trimestre}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)' }} title="Fecha de Ingreso">
                          <Calendar size={13} color="var(--sena-primary)" />
                          <span><strong>Ingreso:</strong> {formatDate(ficha.fechaIngreso)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }} title="Fecha de Salida">
                          <CalendarCheck size={13} color="#f59e0b" />
                          <span><strong>Salida:</strong> {formatDate(ficha.fechaSalida)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Users size={14} color="var(--text-dim)" />
                        <strong>{ficha.totalAprendices}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {fichaComps.length} competencias ({fichaHoras}h prog.)
                        </span>
                        {baseProg && fichaComps.length < baseProg.competencias.length && (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', width: 'fit-content' }}
                            onClick={() => {
                              const loaded = reloadCompetenciasForFicha(ficha.id);
                              alert(`Se sincronizaron ${loaded} competencias del programa para la ficha ${ficha.codigo}.`);
                            }}
                            title="Sincronizar competencias faltantes del programa"
                          >
                            <RefreshCw size={10} />
                            <span>Sincronizar ({baseProg.competencias.length})</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(ficha)}
                          title="Editar ficha"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar la ficha ${ficha.codigo}? Se eliminarán también sus competencias y horarios.`)) {
                              deleteFicha(ficha.id);
                            }
                          }}
                          title="Eliminar ficha"
                          style={{ color: '#f43f5e' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ficha */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFicha ? 'Editar Ficha de Formación' : 'Registrar Nueva Ficha de Formación'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Program Selector */}
          <div className="form-group" style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <label className="form-label" style={{ color: 'var(--sena-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={14} />
              <span>Programa de Formación Base *</span>
            </label>
            <select
              className="form-select"
              value={programaId}
              onChange={(e) => handleProgramSelection(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {programas.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  [{prog.codigo}] {prog.nombre} ({prog.competencias?.length || 0} competencias)
                </option>
              ))}
              <option value="custom">-- Otro Programa / Personalizado --</option>
            </select>
            <span className="form-help">
              Al seleccionar un programa, sus competencias y nivel de formación se cargarán automáticamente para esta ficha.
            </span>
          </div>

          {/* Automatic Competencies Preview */}
          {selectedProgramObj && (
            <div style={{ background: 'rgba(57, 169, 0, 0.07)', border: '1px solid rgba(57, 169, 0, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--sena-primary)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <Sparkles size={14} />
                <span>
                  {editingFicha ? 'Malla curricular base del programa' : `Se crearán automáticamente ${selectedProgramObj.competencias?.length || 0} competencias para esta ficha:`}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(selectedProgramObj.competencias || []).map((c) => (
                  <span
                    key={c.id}
                    className="badge badge-gray"
                    style={{ fontSize: '0.72rem', background: 'var(--bg-surface)' }}
                    title={`${c.codigo} - ${c.nombre} (${c.horasSemanales}h/sem)`}
                  >
                    <strong>{c.codigo}</strong> • {c.nombre.slice(0, 26)}... ({c.horasSemanales}h)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código de Ficha *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. 2670123"
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
              value={nombrePrograma}
              onChange={(e) => setNombrePrograma(e.target.value)}
            />
          </div>

          {/* Fechas de Ingreso y Salida */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de Ingreso</label>
              <input
                type="date"
                className="form-input"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
              />
              <span className="form-help">Inicio de la formación lectiva</span>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Salida</label>
              <input
                type="date"
                className="form-input"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
              <span className="form-help">Fin de formación / etapa productiva</span>
            </div>
          </div>

          {fechaIngreso && fechaSalida && fechaSalida < fechaIngreso && (
            <div className="alert-banner warning" style={{ padding: '0.6rem 0.85rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.8rem' }}>
                Atención: La fecha de salida es anterior a la fecha de ingreso.
              </span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jornada de Formación</label>
              <select
                className="form-select"
                value={jornada}
                onChange={(e) => setJornada(e.target.value as JornadaType)}
              >
                <option value="Mañana">Mañana (06:00 - 12:00)</option>
                <option value="Tarde">Tarde (12:00 - 18:00)</option>
                <option value="Noche">Noche (18:00 - 22:00)</option>
                <option value="Mixta">Mixta (06:00 - 18:00 Flexible)</option>
                <option value="Fin de Semana">Fin de Semana (Sábados 07:00 - 17:00)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Trimestre Lectivo</label>
              <input
                type="number"
                min={1}
                max={12}
                className="form-input"
                value={trimestre}
                onChange={(e) => setTrimestre(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total de Aprendices</label>
              <input
                type="number"
                min={1}
                max={60}
                className="form-input"
                value={totalAprendices}
                onChange={(e) => setTotalAprendices(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sede / Centro</label>
              <input
                type="text"
                className="form-input"
                value={sede}
                onChange={(e) => setSede(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Días Hábiles de Clase</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: diasFormacion.includes(day) ? 'var(--sena-primary)' : 'var(--border-subtle)',
                    background: diasFormacion.includes(day) ? 'var(--sena-primary-light)' : 'var(--bg-input)',
                    color: diasFormacion.includes(day) ? 'var(--sena-primary)' : 'var(--text-muted)'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <GraduationCap size={16} />
              {editingFicha ? 'Guardar Cambios' : 'Registrar Ficha y Cargar Competencias'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


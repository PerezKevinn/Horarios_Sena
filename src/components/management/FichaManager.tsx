import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, GraduationCap, Users } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { Ficha, JornadaType, DayOfWeek } from '../../types';
import { JORNADA_CONFIG, DAYS_OF_WEEK } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const FichaManager: React.FC = () => {
  const { fichas, addFicha, updateFicha, deleteFicha, competencias, horarios } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null);

  // Form state
  const [codigo, setCodigo] = useState('');
  const [nombrePrograma, setNombrePrograma] = useState('');
  const [nivelFormacion, setNivelFormacion] = useState<Ficha['nivelFormacion']>('Tecnólogo');
  const [jornada, setJornada] = useState<JornadaType>('Mañana');
  const [trimestre, setTrimestre] = useState(1);
  const [totalAprendices, setTotalAprendices] = useState(30);
  const [sede, setSede] = useState('Centro de Teleinformática y Producción');
  const [diasFormacion, setDiasFormacion] = useState<DayOfWeek[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);

  const openAddModal = () => {
    setEditingFicha(null);
    setCodigo('');
    setNombrePrograma('');
    setNivelFormacion('Tecnólogo');
    setJornada('Mañana');
    setTrimestre(1);
    setTotalAprendices(30);
    setSede('Centro de Teleinformática y Producción');
    setDiasFormacion(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setIsModalOpen(true);
  };

  const openEditModal = (ficha: Ficha) => {
    setEditingFicha(ficha);
    setCodigo(ficha.codigo);
    setNombrePrograma(ficha.nombrePrograma);
    setNivelFormacion(ficha.nivelFormacion);
    setJornada(ficha.jornada);
    setTrimestre(ficha.trimestre);
    setTotalAprendices(ficha.totalAprendices);
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
      nombrePrograma,
      nivelFormacion,
      jornada,
      trimestre: Number(trimestre),
      totalAprendices: Number(totalAprendices),
      sede,
      diasFormacion,
    };

    if (editingFicha) {
      updateFicha(editingFicha.id, payload);
    } else {
      addFicha(payload);
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

  const filteredFichas = fichas.filter(f =>
    f.codigo.includes(searchTerm) ||
    f.nombrePrograma.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.jornada.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Gestión de Fichas de Formación</h2>
          <p>Administra los grupos, jornadas asignadas, número de aprendices y trimestres lectivos.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Nueva Ficha</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código de ficha, programa o jornada..."
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
              <th>Programa de Formación</th>
              <th>Nivel</th>
              <th>Jornada & Horario</th>
              <th>Trimestre</th>
              <th>Aprendices</th>
              <th>Competencias</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredFichas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron fichas registradas.
                </td>
              </tr>
            ) : (
              filteredFichas.map((ficha) => {
                const fichaComps = competencias.filter(c => c.fichaId === ficha.id);
                const fichaHoras = horarios.filter(h => h.fichaId === ficha.id).reduce((s, h) => s + h.duracionHoras, 0);

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
                      {ficha.sede && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ficha.sede}
                        </div>
                      )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Users size={14} color="var(--text-dim)" />
                        <strong>{ficha.totalAprendices}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {fichaComps.length} competencias ({fichaHoras}h prog.)
                      </span>
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
        title={editingFicha ? 'Editar Ficha de Formación' : 'Registrar Nueva Ficha'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label className="form-label">Nombre del Programa *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Ej. Tecnólogo en Análisis y Desarrollo de Software (ADSO)"
              value={nombrePrograma}
              onChange={(e) => setNombrePrograma(e.target.value)}
            />
          </div>

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
              {editingFicha ? 'Guardar Cambios' : 'Registrar Ficha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

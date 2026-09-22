import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, Clock } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { Competencia } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const CompetenciaManager: React.FC = () => {
  const {
    competencias,
    fichas,
    instructores,
    ambientes,
    addCompetencia,
    updateCompetencia,
    deleteCompetencia,
    horarios
  } = useSchedule();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFicha, setFilterFicha] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competencia | null>(null);

  // Form State
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [resultadoAprendizaje, setResultadoAprendizaje] = useState('');
  const [fichaId, setFichaId] = useState(fichas[0]?.id || '');
  const [instructorId, setInstructorId] = useState(instructores[0]?.id || '');
  const [ambienteId, setAmbienteId] = useState(ambientes[0]?.id || '');
  const [horasSemanales, setHorasSemanales] = useState(8);
  const [horasTotales, setHorasTotales] = useState(96);
  const [bloqueMinimoHoras, setBloqueMinimoHoras] = useState(2);

  const openAddModal = () => {
    setEditingComp(null);
    setCodigo('');
    setNombre('');
    setResultadoAprendizaje('');
    setFichaId(fichas[0]?.id || '');
    setInstructorId(instructores[0]?.id || '');
    setAmbienteId(ambientes[0]?.id || '');
    setHorasSemanales(8);
    setHorasTotales(96);
    setBloqueMinimoHoras(2);
    setIsModalOpen(true);
  };

  const openEditModal = (comp: Competencia) => {
    setEditingComp(comp);
    setCodigo(comp.codigo);
    setNombre(comp.nombre);
    setResultadoAprendizaje(comp.resultadoAprendizaje || '');
    setFichaId(comp.fichaId);
    setInstructorId(comp.instructorId);
    setAmbienteId(comp.ambienteId || '');
    setHorasSemanales(comp.horasSemanales);
    setHorasTotales(comp.horasTotales);
    setBloqueMinimoHoras(comp.bloqueMinimoHoras || 2);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim() || !fichaId || !instructorId) {
      alert('Por favor completa los campos obligatorios (Código, Nombre, Ficha e Instructor).');
      return;
    }

    const payload = {
      codigo,
      nombre,
      resultadoAprendizaje,
      fichaId,
      instructorId,
      ambienteId: ambienteId || undefined,
      horasSemanales: Number(horasSemanales),
      horasTotales: Number(horasTotales),
      bloqueMinimoHoras: Number(bloqueMinimoHoras),
    };

    if (editingComp) {
      updateCompetencia(editingComp.id, payload);
    } else {
      addCompetencia(payload);
    }

    setIsModalOpen(false);
  };

  const filteredCompetencias = competencias.filter(c => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo.includes(searchTerm) ||
      (c.resultadoAprendizaje && c.resultadoAprendizaje.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFicha = filterFicha === 'all' || c.fichaId === filterFicha;

    return matchesSearch && matchesFicha;
  });

  const getFicha = (id: string) => fichas.find(f => f.id === id);
  const getInstructor = (id: string) => instructores.find(i => i.id === id);
  const getAmbiente = (id?: string) => ambientes.find(a => a.id === id);

  const getScheduledHours = (compId: string) => {
    return horarios
      .filter(h => h.competenciaId === compId)
      .reduce((sum, h) => sum + h.duracionHoras, 0);
  };

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Gestión de Competencias y Horas</h2>
          <p>Define las competencias por ficha, instructor responsable, horas semanales requeridas y ambiente de aprendizaje.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Nueva Competencia</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código de competencia o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <label>Ficha:</label>
          <select
            className="form-select"
            value={filterFicha}
            onChange={(e) => setFilterFicha(e.target.value)}
            style={{ width: '220px' }}
          >
            <option value="all">Todas las Fichas</option>
            {fichas.map(f => (
              <option key={f.id} value={f.id}>{f.codigo} - {f.nombrePrograma.slice(0, 25)}...</option>
            ))}
          </select>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de la Competencia</th>
              <th>Ficha Asignada</th>
              <th>Instructor Asignado</th>
              <th>Ambiente</th>
              <th>Horas Semanales</th>
              <th>Estado Asignación</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompetencias.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron competencias registradas.
                </td>
              </tr>
            ) : (
              filteredCompetencias.map((comp) => {
                const ficha = getFicha(comp.fichaId);
                const inst = getInstructor(comp.instructorId);
                const amb = getAmbiente(comp.ambienteId);
                const progHours = getScheduledHours(comp.id);
                const isFullyScheduled = progHours >= comp.horasSemanales;

                return (
                  <tr key={comp.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>
                        {comp.codigo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-word', maxWidth: '350px' }}>
                        {comp.nombre}
                      </div>
                      {comp.resultadoAprendizaje && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                          RAP: {comp.resultadoAprendizaje}
                        </div>
                      )}
                    </td>
                    <td>
                      {ficha ? (
                        <div>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{ficha.codigo}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ficha.jornada}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#f43f5e' }}>Sin ficha</span>
                      )}
                    </td>
                    <td>
                      {inst ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: inst.color }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{inst.nombre}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#f43f5e' }}>Sin instructor</span>
                      )}
                    </td>
                    <td>
                      {amb ? (
                        <span className="badge badge-gray">{amb.codigo}</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Cualquiera</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                        <Clock size={14} color="var(--text-dim)" />
                        <span>{comp.horasSemanales}h / sem</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Total: {comp.horasTotales}h
                      </div>
                    </td>
                    <td>
                      {isFullyScheduled ? (
                        <Badge variant="sena">
                          Completada ({progHours}/{comp.horasSemanales}h)
                        </Badge>
                      ) : (
                        <Badge variant="amber">
                          Pendiente ({progHours}/{comp.horasSemanales}h)
                        </Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(comp)}
                          title="Editar competencia"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar la competencia ${comp.codigo}? Se quitarán sus horarios asociados.`)) {
                              deleteCompetencia(comp.id);
                            }
                          }}
                          title="Eliminar competencia"
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

      {/* Modal Competencia */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingComp ? 'Editar Competencia' : 'Registrar Nueva Competencia'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código de la Competencia *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. 220501096"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ficha de Formación *</label>
              <select
                className="form-select"
                required
                value={fichaId}
                onChange={(e) => setFichaId(e.target.value)}
              >
                <option value="">-- Seleccionar Ficha --</option>
                {fichas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.codigo} - {f.nombrePrograma.slice(0, 30)} ({f.jornada})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre Completo de la Competencia *</label>
            <textarea
              className="form-textarea"
              required
              rows={2}
              placeholder="Ej. Desarrollar la solución de software de acuerdo con el diseño y metodologías de desarrollo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resultado de Aprendizaje (RAP)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Construir la interfaz de usuario con frameworks modernos"
              value={resultadoAprendizaje}
              onChange={(e) => setResultadoAprendizaje(e.target.value)}
            />
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
              <label className="form-label">Ambiente Sugerido</label>
              <select
                className="form-select"
                value={ambienteId}
                onChange={(e) => setAmbienteId(e.target.value)}
              >
                <option value="">Cualquier ambiente disponible</option>
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
              <label className="form-label">Horas Semanales *</label>
              <input
                type="number"
                min={1}
                max={40}
                className="form-input"
                required
                value={horasSemanales}
                onChange={(e) => setHorasSemanales(Number(e.target.value))}
              />
              <span className="form-help">Cantidad de horas que se deben programar a la semana</span>
            </div>

            <div className="form-group">
              <label className="form-label">Horas Totales del Trimestre</label>
              <input
                type="number"
                min={1}
                max={400}
                className="form-input"
                value={horasTotales}
                onChange={(e) => setHorasTotales(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Duración Mínima por Bloque (Horas)</label>
            <select
              className="form-select"
              value={bloqueMinimoHoras}
              onChange={(e) => setBloqueMinimoHoras(Number(e.target.value))}
            >
              <option value={2}>Bloques de 2 Horas</option>
              <option value={3}>Bloques de 3 Horas</option>
              <option value={4}>Bloques de 4 Horas</option>
              <option value={5}>Bloques de 5 Horas</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <BookOpen size={16} />
              {editingComp ? 'Guardar Cambios' : 'Registrar Competencia'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

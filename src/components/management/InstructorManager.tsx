import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, Mail } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { Instructor, DayOfWeek } from '../../types';
import { DAYS_OF_WEEK } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const InstructorManager: React.FC = () => {
  const { instructores, addInstructor, updateInstructor, deleteInstructor, horarios } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Instructor | null>(null);

  // Form State
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [vinculacion, setVinculacion] = useState<'Planta' | 'Contratista'>('Contratista');
  const [maxHorasSemanales, setMaxHorasSemanales] = useState<number>(40);
  const [color, setColor] = useState('#10B981');
  const [diasDisponibles, setDiasDisponibles] = useState<DayOfWeek[]>([...DAYS_OF_WEEK]);

  const openAddModal = () => {
    setEditingInst(null);
    setDocumento('');
    setNombre('');
    setEmail('');
    setTelefono('');
    setEspecialidad('');
    setVinculacion('Contratista');
    setMaxHorasSemanales(40);
    setColor('#10B981');
    setDiasDisponibles([...DAYS_OF_WEEK]);
    setIsModalOpen(true);
  };

  const openEditModal = (inst: Instructor) => {
    setEditingInst(inst);
    setDocumento(inst.documento);
    setNombre(inst.nombre);
    setEmail(inst.email);
    setTelefono(inst.telefono || '');
    setEspecialidad(inst.especialidad);
    setVinculacion(inst.vinculacion);
    setMaxHorasSemanales(inst.maxHorasSemanales);
    setColor(inst.color);
    setDiasDisponibles(inst.diasDisponibles || [...DAYS_OF_WEEK]);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !documento.trim()) {
      alert('Por favor completa el nombre y documento del instructor.');
      return;
    }

    const payload = {
      documento,
      nombre,
      email,
      telefono,
      especialidad,
      vinculacion,
      maxHorasSemanales: Number(maxHorasSemanales),
      color,
      diasDisponibles,
    };

    if (editingInst) {
      updateInstructor(editingInst.id, payload);
    } else {
      addInstructor(payload);
    }

    setIsModalOpen(false);
  };

  const toggleDay = (day: DayOfWeek) => {
    if (diasDisponibles.includes(day)) {
      setDiasDisponibles(diasDisponibles.filter(d => d !== day));
    } else {
      setDiasDisponibles([...diasDisponibles, day]);
    }
  };

  const filteredInstructores = instructores.filter(i =>
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.documento.includes(searchTerm) ||
    i.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute allocated hours per instructor
  const getAssignedHours = (instructorId: string) => {
    return horarios
      .filter(h => h.instructorId === instructorId)
      .reduce((sum, h) => sum + h.duracionHoras, 0);
  };

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Gestión de Instructores</h2>
          <p>Parametriza la disponibilidad, vinculación y tope máximo de horas semanales de los instructores.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Nuevo Instructor</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, documento o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Instructor</th>
              <th>Documento</th>
              <th>Especialidad / Área</th>
              <th>Vinculación</th>
              <th>Carga Semanal</th>
              <th>Disponibilidad</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstructores.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron instructores registrados.
                </td>
              </tr>
            ) : (
              filteredInstructores.map((inst) => {
                const assignedHours = getAssignedHours(inst.id);
                const isOverloaded = assignedHours > inst.maxHorasSemanales;
                const percentage = Math.min(100, Math.round((assignedHours / inst.maxHorasSemanales) * 100));

                return (
                  <tr key={inst.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: inst.color,
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.88rem' }}>{inst.nombre}</strong>
                          {inst.email && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Mail size={12} /> {inst.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)' }}>{inst.documento}</span></td>
                    <td>{inst.especialidad}</td>
                    <td>
                      <Badge variant={inst.vinculacion === 'Planta' ? 'sena' : 'purple'}>
                        {inst.vinculacion}
                      </Badge>
                    </td>
                    <td style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, color: isOverloaded ? '#f43f5e' : 'var(--text-main)' }}>
                          {assignedHours}h / {inst.maxHorasSemanales}h
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}>{percentage}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: isOverloaded ? '#f43f5e' : inst.color,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {inst.diasDisponibles && inst.diasDisponibles.length < 6
                          ? inst.diasDisponibles.map(d => d.slice(0, 2)).join(', ')
                          : 'Lunes a Sábado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(inst)}
                          title="Editar instructor"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar al instructor ${inst.nombre}? Se quitarán sus asignaciones del horario.`)) {
                              deleteInstructor(inst.id);
                            }
                          }}
                          title="Eliminar instructor"
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

      {/* Modal Agregar / Editar Instructor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInst ? 'Editar Instructor' : 'Registrar Nuevo Instructor'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. Ing. Carlos Alberto Morales Gómez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cédula / Documento *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. 1023456789"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-input"
                placeholder="cmorales@sena.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono de Contacto</label>
              <input
                type="text"
                className="form-input"
                placeholder="3104567890"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Especialidad / Área Técnica</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Desarrollo de Software, Redes, Bases de Datos, Ética"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Vinculación</label>
              <select
                className="form-select"
                value={vinculacion}
                onChange={(e) => {
                  const val = e.target.value as 'Planta' | 'Contratista';
                  setVinculacion(val);
                  if (val === 'Planta' && maxHorasSemanales === 40) setMaxHorasSemanales(32);
                  if (val === 'Contratista' && maxHorasSemanales === 32) setMaxHorasSemanales(40);
                }}
              >
                <option value="Contratista">Contratista (Generalmente 40h)</option>
                <option value="Planta">Planta (Generalmente 32h directas)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Horas Máximas Semanales</label>
              <input
                type="number"
                min={1}
                max={60}
                className="form-input"
                value={maxHorasSemanales}
                onChange={(e) => setMaxHorasSemanales(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Color de Identificación en Horario</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '45px', height: '38px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Días Disponibles</label>
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
                      borderColor: diasDisponibles.includes(day) ? 'var(--sena-primary)' : 'var(--border-subtle)',
                      background: diasDisponibles.includes(day) ? 'var(--sena-primary-light)' : 'var(--bg-input)',
                      color: diasDisponibles.includes(day) ? 'var(--sena-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <UserCheck size={16} />
              {editingInst ? 'Guardar Cambios' : 'Registrar Instructor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

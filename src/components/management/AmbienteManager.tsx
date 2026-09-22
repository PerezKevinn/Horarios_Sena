import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Monitor, Users } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import type { Ambiente } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const AmbienteManager: React.FC = () => {
  const { ambientes, addAmbiente, updateAmbiente, deleteAmbiente, horarios } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmb, setEditingAmb] = useState<Ambiente | null>(null);

  // Form State
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [sede, setSede] = useState('Bloque B - Piso 3');
  const [tipo, setTipo] = useState<Ambiente['tipo']>('Sistemas / Cómputo');
  const [capacidad, setCapacidad] = useState(30);
  const [equiposDisponibles, setEquiposDisponibles] = useState(30);

  const openAddModal = () => {
    setEditingAmb(null);
    setCodigo('');
    setNombre('');
    setSede('Bloque B - Piso 3');
    setTipo('Sistemas / Cómputo');
    setCapacidad(30);
    setEquiposDisponibles(30);
    setIsModalOpen(true);
  };

  const openEditModal = (amb: Ambiente) => {
    setEditingAmb(amb);
    setCodigo(amb.codigo);
    setNombre(amb.nombre);
    setSede(amb.sede);
    setTipo(amb.tipo);
    setCapacidad(amb.capacidad);
    setEquiposDisponibles(amb.equiposDisponibles || amb.capacidad);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      alert('Por favor completa el código y nombre del ambiente.');
      return;
    }

    const payload = {
      codigo,
      nombre,
      sede,
      tipo,
      capacidad: Number(capacidad),
      equiposDisponibles: Number(equiposDisponibles),
    };

    if (editingAmb) {
      updateAmbiente(editingAmb.id, payload);
    } else {
      addAmbiente(payload);
    }

    setIsModalOpen(false);
  };

  const filteredAmbientes = ambientes.filter(a =>
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sede.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOccupancyHours = (ambId: string) => {
    return horarios
      .filter(h => h.ambienteId === ambId)
      .reduce((sum, h) => sum + h.duracionHoras, 0);
  };

  const getTipoBadgeVariant = (t: Ambiente['tipo']) => {
    switch (t) {
      case 'Sistemas / Cómputo': return 'sena';
      case 'Laboratorio Redes': return 'purple';
      case 'Taller Especializado': return 'amber';
      case 'Auditorio / Polivalente': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="panel-card animate-fade-in">
      <div className="panel-header">
        <div className="panel-title-area">
          <h2>Gestión de Ambientes de Formación</h2>
          <p>Administra las salas de cómputo, talleres especializados, aulas y auditorios disponibles en el centro.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Nuevo Ambiente</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código, nombre, tipo de ambiente o bloque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código / Número</th>
              <th>Nombre del Ambiente</th>
              <th>Tipo de Ambiente</th>
              <th>Sede / Ubicación</th>
              <th>Capacidad</th>
              <th>Equipos de Cómputo</th>
              <th>Horas Ocupadas</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAmbientes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron ambientes registrados.
                </td>
              </tr>
            ) : (
              filteredAmbientes.map((amb) => {
                const hours = getOccupancyHours(amb.id);

                return (
                  <tr key={amb.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>
                        {amb.codigo}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-word' }}>
                        {amb.nombre}
                      </div>
                    </td>
                    <td>
                      <Badge variant={getTipoBadgeVariant(amb.tipo)}>
                        {amb.tipo}
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {amb.sede}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} color="var(--text-dim)" />
                        <strong>{amb.capacidad} aprendices</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Monitor size={14} color="var(--text-dim)" />
                        <span>{amb.equiposDisponibles ?? 'N/A'} PCs</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {hours}h / sem
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(amb)}
                          title="Editar ambiente"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar el ${amb.codigo}? Se quitará de los horarios correspondientes.`)) {
                              deleteAmbiente(amb.id);
                            }
                          }}
                          title="Eliminar ambiente"
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

      {/* Modal Ambiente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAmb ? 'Editar Ambiente de Formación' : 'Registrar Nuevo Ambiente'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código / Número de Ambiente *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. Ambiente 301"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Ambiente</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
              >
                <option value="Sistemas / Cómputo">Sistemas / Cómputo</option>
                <option value="Laboratorio Redes">Laboratorio Redes</option>
                <option value="Taller Especializado">Taller Especializado</option>
                <option value="Aula Convencional">Aula Convencional</option>
                <option value="Auditorio / Polivalente">Auditorio / Polivalente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre Descriptivo *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Ej. Laboratorio de Desarrollo de Software FullStack"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sede / Ubicación del Bloque</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Bloque B - Piso 3"
              value={sede}
              onChange={(e) => setSede(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Capacidad de Aprendices</label>
              <input
                type="number"
                min={5}
                max={150}
                className="form-input"
                value={capacidad}
                onChange={(e) => setCapacidad(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Equipos de Cómputo Funcionales</label>
              <input
                type="number"
                min={0}
                max={150}
                className="form-input"
                value={equiposDisponibles}
                onChange={(e) => setEquiposDisponibles(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Building2 size={16} />
              {editingAmb ? 'Guardar Cambios' : 'Registrar Ambiente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

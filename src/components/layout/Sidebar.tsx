import React from 'react';
import {
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    instructores,
    fichas,
    competencias,
    ambientes,
    conflicts,
    horarios,
  } = useSchedule();

  return (
    <aside className="app-sidebar">
      <div className="nav-section-title">Navegación Principal</div>

      <button
        className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
        onClick={() => setActiveTab('schedule')}
      >
        <div className="nav-item-left">
          <Calendar size={18} />
          <span>Matriz de Horarios</span>
        </div>
        <span className="nav-counter">{horarios.length}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'fichas' ? 'active' : ''}`}
        onClick={() => setActiveTab('fichas')}
      >
        <div className="nav-item-left">
          <GraduationCap size={18} />
          <span>Fichas de Formación</span>
        </div>
        <span className="nav-counter">{fichas.length}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'instructores' ? 'active' : ''}`}
        onClick={() => setActiveTab('instructores')}
      >
        <div className="nav-item-left">
          <Users size={18} />
          <span>Instructores</span>
        </div>
        <span className="nav-counter">{instructores.length}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'competencias' ? 'active' : ''}`}
        onClick={() => setActiveTab('competencias')}
      >
        <div className="nav-item-left">
          <BookOpen size={18} />
          <span>Competencias</span>
        </div>
        <span className="nav-counter">{competencias.length}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'ambientes' ? 'active' : ''}`}
        onClick={() => setActiveTab('ambientes')}
      >
        <div className="nav-item-left">
          <Building2 size={18} />
          <span>Ambientes</span>
        </div>
        <span className="nav-counter">{ambientes.length}</span>
      </button>

      <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Diagnóstico</div>

      <button
        className={`nav-item ${activeTab === 'conflicts' ? 'active' : ''}`}
        onClick={() => setActiveTab('conflicts')}
      >
        <div className="nav-item-left">
          <AlertTriangle size={18} color={conflicts.length > 0 ? '#f43f5e' : undefined} />
          <span>Conflictos Detectados</span>
        </div>
        <span className={`nav-counter ${conflicts.length > 0 ? 'alert' : ''}`}>
          {conflicts.length}
        </span>
      </button>

      <div style={{ marginTop: 'auto', padding: '1rem 0.5rem 0.25rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          <strong>Centro de Formación SENA</strong><br />
          Planificador de Horarios Académicos
        </div>
      </div>
    </aside>
  );
};

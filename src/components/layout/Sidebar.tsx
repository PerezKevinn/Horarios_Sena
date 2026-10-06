import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Users,
  GraduationCap,
  Layers,
  Building2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    timeScale,
    setTimeScale,
    programas,
    instructores,
    fichas,
    ambientes,
    conflicts,
    horarios,
  } = useSchedule();

  return (
    <aside className="app-sidebar">
      <div className="nav-section-title">Planeación & Horarios</div>

      <button
        className={`nav-item ${activeTab === 'schedule' && timeScale === 'semanal' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('schedule');
          setTimeScale('semanal');
        }}
      >
        <div className="nav-item-left">
          <Calendar size={18} />
          <span>Matriz Semanal</span>
        </div>
        <span className="nav-counter">{horarios.length}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'schedule' && timeScale === 'mensual' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('schedule');
          setTimeScale('mensual');
        }}
      >
        <div className="nav-item-left">
          <CalendarDays size={18} />
          <span>Calendario Mensual</span>
        </div>
      </button>

      <button
        className={`nav-item ${activeTab === 'schedule' && timeScale === 'anual' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('schedule');
          setTimeScale('anual');
        }}
      >
        <div className="nav-item-left">
          <CalendarRange size={18} color={activeTab === 'schedule' && timeScale === 'anual' ? 'white' : 'var(--sena-primary)'} />
          <span>Planeación Anual</span>
        </div>
        <span className="badge badge-sena" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>Anual</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'cuadro-horas' ? 'active' : ''}`}
        onClick={() => setActiveTab('cuadro-horas')}
      >
        <div className="nav-item-left">
          <Clock size={18} color={activeTab === 'cuadro-horas' ? 'white' : '#10B981'} />
          <span>Cuadro de Horas (80%)</span>
        </div>
        <span className="badge badge-sena" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>80%</span>
      </button>

      <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Gestión Curricular</div>

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
        className={`nav-item ${activeTab === 'programas' ? 'active' : ''}`}
        onClick={() => setActiveTab('programas')}
      >
        <div className="nav-item-left">
          <Layers size={18} />
          <span>Programas de Formación</span>
        </div>
        <span className="nav-counter">{programas.length}</span>
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

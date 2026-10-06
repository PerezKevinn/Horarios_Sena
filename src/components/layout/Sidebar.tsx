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
  UserCog
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';

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

  const { currentUser, isAdmin, isInstructor, currentInstructorId, users } = useAuth();

  // If instructor, count their assigned classes
  const instructorHorariosCount = isInstructor && currentInstructorId
    ? horarios.filter((h) => h.instructorId === currentInstructorId).length
    : horarios.length;

  return (
    <aside className="app-sidebar">
      {/* Primary Section */}
      <div className="nav-section-title">
        {isAdmin ? 'Planeación & Horarios' : 'Mi Horario & Carga'}
      </div>

      <button
        className={`nav-item ${activeTab === 'schedule' && timeScale === 'semanal' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('schedule');
          setTimeScale('semanal');
        }}
      >
        <div className="nav-item-left">
          <Calendar size={18} />
          <span>{isAdmin ? 'Matriz Semanal' : 'Mi Horario Semanal'}</span>
        </div>
        <span className="nav-counter">{instructorHorariosCount}</span>
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
          <span>{isAdmin ? 'Cuadro de Horas (80%)' : 'Mi Cuadro de Horas (80%)'}</span>
        </div>
        <span className="badge badge-sena" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>80%</span>
      </button>

      {/* Curriculum & Resources Section */}
      <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>
        {isAdmin ? 'Gestión Curricular' : 'Consultas Académicas'}
      </div>

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
          <span>{isAdmin ? 'Instructores' : 'Directorio Instructores'}</span>
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

      {/* Administration & Access (Only for Admin) */}
      {isAdmin && (
        <>
          <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Administración & Acceso</div>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <div className="nav-item-left">
              <UserCog size={18} color={activeTab === 'users' ? 'white' : '#F59E0B'} />
              <span>Gestión de Usuarios</span>
            </div>
            <span className="nav-counter">{users.length}</span>
          </button>

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
        </>
      )}

      {/* Footer User Info Card */}
      <div style={{ marginTop: 'auto', padding: '0.85rem 0.5rem 0.25rem', borderTop: '1px solid var(--border-subtle)' }}>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: isAdmin
                  ? 'linear-gradient(135deg, #F59E0B, #EA580C)'
                  : 'linear-gradient(135deg, #39A900, #10B981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem'
              }}
            >
              {isAdmin ? '👑' : '👨‍🏫'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.64rem', color: isAdmin ? '#f59e0b' : 'var(--sena-primary)', fontWeight: 700 }}>
                {isAdmin ? 'Rol: Administrador' : 'Rol: Instructor'}
              </span>
            </div>
          </div>
        )}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>
          <strong>Centro de Formación SENA</strong><br />
          Planificador de Horarios Académicos
        </div>
      </div>
    </aside>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Printer,
  Moon,
  Sun,
  Database,
  RefreshCw,
  Upload,
  AlertTriangle,
  CalendarCheck,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';
import { exportScheduleToCSV, exportStateAsJSON } from '../../utils/exportUtils';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';

export const Header: React.FC = () => {
  const {
    theme,
    setTheme,
    programas,
    instructores,
    fichas,
    ambientes,
    competencias,
    horarios,
    runAutoScheduler,
    resetToDemoData,
    clearAllHorarios,
    importStateFromJSON,
  } = useSchedule();

  const { currentUser, isAdmin, logout } = useAuth();

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [keepExisting, setKeepExisting] = useState(false);
  const [genReport, setGenReport] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportScheduleToCSV(horarios, instructores, fichas, ambientes, competencias);
  };

  const handleExportJSON = () => {
    exportStateAsJSON({
      programas,
      instructores,
      fichas,
      ambientes,
      competencias,
      horarios,
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importStateFromJSON(json);
        if (success) {
          alert('¡Copia de seguridad importada exitosamente!');
          setIsBackupModalOpen(false);
        } else {
          alert('El archivo no tiene el formato de respaldo válido de SENA Horarios.');
        }
      } catch {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleRunAuto = () => {
    const result = runAutoScheduler(keepExisting);
    setGenReport(result);
    setIsGenModalOpen(false);

    // Trigger celebratory confetti if generation succeeded
    if (result.horarios.length > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#39A900', '#10B981', '#3B82F6', '#F59E0B']
        });
      } catch (e) {
        // ignore if canvas-confetti fails
      }
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-badge">
            <span>S</span>
          </div>
          <div className="brand-text">
            <h1>
              SENA Horarios
              <span className="badge badge-sena" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                v1.0
              </span>
            </h1>
            <p>Planificación de Ambientes, Instructores y Fichas</p>
          </div>
        </div>

        <div className="header-actions">
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setIsGenModalOpen(true)}
              title="Generar distribución automática de horarios"
            >
              <Sparkles size={16} />
              <span>Generar Horario</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Exportar a Excel/CSV"
          >
            <Download size={16} />
            <span>Exportar Excel</span>
          </button>

          <button
            className="btn btn-icon"
            onClick={handlePrint}
            title="Imprimir / Exportar a PDF"
          >
            <Printer size={18} />
          </button>

          {isAdmin && (
            <button
              className="btn btn-icon"
              onClick={() => setIsBackupModalOpen(true)}
              title="Copias de Seguridad & Datos Demo"
            >
              <Database size={18} />
            </button>
          )}

          <button
            className="btn btn-icon"
            onClick={handleToggleTheme}
            title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile Pill & Dropdown Menu */}
          {currentUser && (
            <div className="header-user-profile-wrap" ref={userMenuRef}>
              <button
                type="button"
                className={`header-user-btn ${isUserMenuOpen ? 'active' : ''}`}
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                title="Perfil de Usuario y Cambio de Rol"
              >
                <div className={`user-avatar-badge ${isAdmin ? 'admin' : ''}`}>
                  {isAdmin ? '👑' : '👨‍🏫'}
                </div>
                <div className="header-user-info">
                  <span className="header-user-name">{currentUser.name}</span>
                  <span className={`header-user-role-badge ${isAdmin ? 'admin' : ''}`}>
                    {isAdmin ? 'Administrador' : 'Instructor SENA'}
                  </span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {isUserMenuOpen && (
                <div className="user-profile-menu-dropdown animate-popover">
                  <div className="user-menu-header">
                    <div className={`user-menu-avatar-large ${isAdmin ? 'admin' : ''}`}>
                      {isAdmin ? '👑' : '👨‍🏫'}
                    </div>
                    <div className="user-menu-user-details">
                      <strong>{currentUser.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.email}</span>
                      {currentUser.cargo && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {currentUser.cargo}
                        </span>
                      )}
                      {currentUser.documento && (
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                          C.C. {currentUser.documento}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 0.5rem 0.25rem 0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>Rol del Sistema:</span>
                      <span className={`header-user-role-badge ${isAdmin ? 'admin' : ''}`}>
                        {isAdmin ? '👑 Administrador' : '👨‍🏫 Instructor'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="user-menu-logout-btn"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Modal: Generar Horario Automático */}
      <Modal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        title="Generador Automático de Horarios SENA"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsGenModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleRunAuto}>
              <Sparkles size={16} />
              Iniciar Generación
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            El motor algorítmico distribuirá automáticamente todas las <strong>competencias</strong> requeridas entre las <strong>fichas</strong>, <strong>instructores</strong> y <strong>ambientes</strong> respetando las siguientes restricciones:
          </p>

          <ul style={{ fontSize: '0.82rem', color: 'var(--text-main)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>✓ Cero cruces de horario para cada instructor.</li>
            <li>✓ Cero cruces en el uso de ambientes de aprendizaje.</li>
            <li>✓ Respeto estricto de la jornada oficial de cada Ficha (Mañana, Tarde, Noche, Mixta).</li>
            <li>✓ Control de límite de horas semanales por instructor (Planta/Contratista).</li>
            <li>✓ Agrupación en bloques pedagógicos continuos (2h a 4h por sesión).</li>
          </ul>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={keepExisting}
                onChange={(e) => setKeepExisting(e.target.checked)}
              />
              <span><strong>Conservar horarios asignados previamente</strong> (solo llenar horas pendientes)</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Modal: Copia de Seguridad y Datos Demo */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Gestión de Datos y Copias de Seguridad"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsBackupModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Cargar Datos Demo SENA
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Carga un conjunto de datos realistas con 6 Instructores, 4 Fichas (ADSO, Redes, Móviles), 6 Ambientes y Competencias listas para programar.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (confirm('¿Deseas restablecer los datos con los ejemplos Demo del SENA?')) {
                  resetToDemoData();
                  setIsBackupModalOpen(false);
                }
              }}
            >
              <RefreshCw size={16} />
              Restablecer a Datos Demo SENA
            </button>
          </div>

          <hr style={{ borderColor: 'var(--border-subtle)' }} />

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Exportar Copia de Seguridad (JSON)
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Guarda un archivo de respaldo completo en tu computador con todos los instructores, fichas, ambientes y horarios actuales.
            </p>
            <button className="btn btn-secondary" onClick={handleExportJSON}>
              <Download size={16} />
              Descargar Respaldo JSON
            </button>
          </div>

          <hr style={{ borderColor: 'var(--border-subtle)' }} />

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Restaurar desde Respaldo (JSON)
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Carga un archivo de respaldo previo para restaurar todo el estado del sistema.
            </p>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Seleccionar Archivo JSON
            </button>
          </div>

          <hr style={{ borderColor: 'var(--border-subtle)' }} />

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f43f5e', marginBottom: '0.35rem' }}>
              Limpiar Horarios Programados
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Elimina todas las asignaciones del calendario dejando intactos los instructores, fichas y competencias.
            </p>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirm('¿Estás seguro de que deseas vaciar toda la matriz de horarios?')) {
                  clearAllHorarios();
                  setIsBackupModalOpen(false);
                }
              }}
            >
              Vaciar Horarios del Calendario
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reporte tras generación */}
      {genReport && (
        <Modal
          isOpen={!!genReport}
          onClose={() => setGenReport(null)}
          title="Resultado de la Generación de Horarios"
          footer={
            <button className="btn btn-primary" onClick={() => setGenReport(null)}>
              Entendido
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="alert-banner success">
              <CalendarCheck size={20} />
              <div>
                <div className="alert-title">¡Generación completada!</div>
                <div>Se han programado un total de <strong>{genReport.stats.totalHorasProgramadas} horas</strong> semanales en la matriz.</div>
              </div>
            </div>

            {genReport.unassignedCompetencias.length > 0 && (
              <div className="alert-banner warning">
                <AlertTriangle size={20} />
                <div>
                  <div className="alert-title">{genReport.unassignedCompetencias.length} Bloques con Asignación Parcial</div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Algunas horas no pudieron ubicarse por disponibilidad de ambientes o límite de horas de instructores:
                  </p>
                  <ul style={{ fontSize: '0.78rem', marginTop: '0.4rem', paddingLeft: '1rem' }}>
                    {genReport.unassignedCompetencias.map((item: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        Ficha {item.fichaCodigo}: {item.competenciaNombre} ({item.horasPendientes}h pendientes) - <em>{item.motivo}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Shield,
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Key,
  RefreshCw,
  Copy,
  Check,
  Mail,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchedule } from '../../context/ScheduleContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import type { User, UserRole, UserStatus } from '../../types';

export const UserManager: React.FC = () => {
  const {
    users,
    currentUser,
    isLoadingUsers,
    refreshUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword
  } = useAuth();

  useEffect(() => {
    refreshUsers();
  }, []);

  const { instructores } = useSchedule();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');

  // Modal State for Create / Edit User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('instructor');
  const [instructorId, setInstructorId] = useState<string>('');
  const [documento, setDocumento] = useState('');
  const [cargo, setCargo] = useState('');
  const [sede, setSede] = useState('Centro de Teleinformática y Producción');
  const [password, setPassword] = useState('');
  const [estado, setEstado] = useState<UserStatus>('Activo');

  // Modal State for Password Reset
  const [isResetPwModalOpen, setIsResetPwModalOpen] = useState(false);
  const [pwTargetUser, setPwTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [copiedPw, setCopiedPw] = useState(false);

  // Stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const instructorCount = users.filter((u) => u.role === 'instructor').length;
  const activeCount = users.filter((u) => u.estado === 'Activo').length;
  const inactiveCount = users.filter((u) => u.estado === 'Inactivo').length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.documento && u.documento.includes(searchTerm)) ||
        (u.cargo && u.cargo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchStatus = filterStatus === 'all' || u.estado === filterStatus;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setRole('instructor');
    setInstructorId(instructores[0]?.id || '');
    setDocumento('');
    setCargo('Instructor de Formación Profesional');
    setSede('Centro de Teleinformática y Producción');
    setPassword('sena2026*');
    setEstado('Activo');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setInstructorId(user.instructorId || '');
    setDocumento(user.documento || '');
    setCargo(user.cargo || '');
    setSede(user.sede || 'Centro de Teleinformática y Producción');
    setPassword('');
    setEstado(user.estado || 'Activo');
    setIsModalOpen(true);
  };

  // When selecting an existing instructor from dropdown, autofill details
  const handleSelectInstructor = (selectedId: string) => {
    setInstructorId(selectedId);
    const inst = instructores.find((i) => i.id === selectedId);
    if (inst) {
      setName(inst.nombre);
      setEmail(inst.email);
      setDocumento(inst.documento);
      setCargo(`Instructor de ${inst.vinculacion} - ${inst.especialidad}`);
    }
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor completa el nombre y el correo institucional.');
      return;
    }

    if (editingUserId) {
      await updateUser(editingUserId, {
        name,
        email,
        role,
        instructorId: role === 'instructor' ? instructorId : undefined,
        documento,
        cargo,
        sede,
        estado,
        ...(password ? { password } : {}),
      });
    } else {
      await addUser({
        name,
        email,
        role,
        instructorId: role === 'instructor' ? instructorId : undefined,
        documento,
        cargo,
        sede,
        estado,
        password: password || 'sena2026*',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    setIsModalOpen(false);
  };

  // Delete User Confirmation
  const handleDeleteUser = async (user: User) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la cuenta de "${user.name}"?`)) {
      await deleteUser(user.id);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (user: User) => {
    setPwTargetUser(user);
    setNewPassword('Sena2026*');
    setCopiedPw(false);
    setIsResetPwModalOpen(true);
  };

  // Confirm Reset Password
  const handleConfirmResetPassword = async () => {
    if (pwTargetUser && newPassword) {
      await resetUserPassword(pwTargetUser.id, newPassword);
      alert(`Contraseña restablecida exitosamente para ${pwTargetUser.name}.`);
      setIsResetPwModalOpen(false);
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
  };

  // Sync Instructors (Auto-generate accounts for any instructor missing one)
  const handleSyncInstructors = async () => {
    let createdCount = 0;
    for (const inst of instructores) {
      const exists = users.some(
        (u) => u.email.toLowerCase() === inst.email.toLowerCase() || u.instructorId === inst.id
      );
      if (!exists) {
        await addUser({
          name: inst.nombre,
          email: inst.email,
          role: 'instructor',
          instructorId: inst.id,
          documento: inst.documento,
          cargo: `Instructor de ${inst.vinculacion} - ${inst.especialidad}`,
          sede: 'Centro de Teleinformática y Producción',
          estado: 'Activo',
          password: 'instructor123',
          createdAt: new Date().toISOString().split('T')[0],
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      alert(`¡Sincronización completa! Se generaron ${createdCount} nuevas cuentas de instructor.`);
    } else {
      alert('Todos los instructores del catálogo ya cuentan con su cuenta de acceso.');
    }
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nombre', 'Correo', 'Rol', 'Documento', 'Cargo', 'Sede', 'Estado', 'Último Acceso'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      u.documento || '',
      `"${u.cargo || ''}"`,
      `"${u.sede || ''}"`,
      u.estado || 'Activo',
      u.lastLogin || 'Nunca',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SENA_Usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="management-container animate-fade-in">
      {/* Header & Stats Strip */}
      <div className="management-header">
        <div>
          <h2>Administración de Usuarios y Roles</h2>
          <p>Control de acceso institucional, cuentas de coordinación e instructores en base de datos PostgreSQL</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={refreshUsers}
            disabled={isLoadingUsers}
            title="Consulta las cuentas reales directamente de la base de datos"
          >
            <RefreshCw size={15} className={isLoadingUsers ? 'animate-spin' : ''} color="var(--sena-primary)" />
            <span>{isLoadingUsers ? 'Consultando...' : 'Refrescar DB'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleSyncInstructors}
            title="Genera cuentas de acceso para todos los instructores registrados"
          >
            <Users size={15} />
            <span>Sincronizar Instructores</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Exportar listado de usuarios a Excel/CSV"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ padding: '0.55rem 1rem' }}
          >
            <Plus size={16} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon sena">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Total Cuentas Registradas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Shield size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{adminCount}</div>
            <div className="stat-label">Administradores (Coordinación)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <GraduationCap size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{instructorCount}</div>
            <div className="stat-label">Instructores SENA</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sena">
            <UserCheck size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Cuentas Activas ({inactiveCount} inactivas)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-input-wrap" style={{ minWidth: '260px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Buscar por nombre, correo, cédula o cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rol:</label>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
            >
              <option value="all">Todos los Roles</option>
              <option value="admin">👑 Solo Administradores</option>
              <option value="instructor">👨‍🏫 Solo Instructores</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado:</label>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Todos los Estados</option>
              <option value="Activo">🟢 Activos</option>
              <option value="Inactivo">🔴 Inactivos</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Mostrando {filteredUsers.length} de {totalUsers} usuarios
        </span>
      </div>

      {/* Users Table */}
      <div className="schedule-table-wrapper" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Documento</th>
              <th>Correo Institucional</th>
              <th>Rol de Acceso</th>
              <th>Cargo / Especialidad</th>
              <th>Estado</th>
              <th>Último Acceso</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No se encontraron usuarios que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isMe = currentUser?.id === user.id;
                const isActive = user.estado !== 'Inactivo';

                return (
                  <tr
                    key={user.id}
                    style={{
                      background: isMe ? 'rgba(57, 169, 0, 0.05)' : undefined,
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background:
                              user.role === 'admin'
                                ? 'linear-gradient(135deg, #F59E0B, #EA580C)'
                                : 'linear-gradient(135deg, #39A900, #10B981)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            color: 'white',
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          {user.role === 'admin' ? '👑' : '👨‍🏫'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 700 }}>
                              {user.name}
                            </span>
                            {isMe && (
                              <span className="badge badge-sena" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
                                Tú
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            ID: {user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {user.documento || 'No registrado'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontSize: '0.83rem' }}>
                        <Mail size={13} color="var(--sena-primary)" />
                        <span style={{ fontWeight: 500 }}>{user.email}</span>
                      </div>
                    </td>

                    <td>
                      <Badge variant={user.role === 'admin' ? 'amber' : 'blue'}>
                        {user.role === 'admin' ? '👑 Administrador' : '👨‍🏫 Instructor'}
                      </Badge>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {user.cargo || 'Funcionario SENA'}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={isMe}
                        className={`badge ${isActive ? 'badge-sena' : 'badge-rose'}`}
                        style={{
                          cursor: isMe ? 'not-allowed' : 'pointer',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                        title={isMe ? 'No puedes desactivar tu propia cuenta' : 'Clic para cambiar estado'}
                      >
                        {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user.lastLogin ? user.lastLogin : 'Pendiente'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="table-icon-btn amber"
                          onClick={() => handleOpenResetPassword(user)}
                          title="Restablecer Contraseña"
                        >
                          <Key size={14} />
                        </button>

                        <button
                          className="table-icon-btn primary"
                          onClick={() => handleOpenEdit(user)}
                          title="Editar Usuario"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          className="table-icon-btn danger"
                          onClick={() => handleDeleteUser(user)}
                          disabled={isMe}
                          title={isMe ? 'No puedes eliminar tu propia cuenta' : 'Eliminar Usuario'}
                          style={{ opacity: isMe ? 0.4 : 1, cursor: isMe ? 'not-allowed' : 'pointer' }}
                        >
                          <Trash2 size={14} />
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

      {/* Modal: Crear / Editar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? 'Editar Cuenta de Usuario' : 'Crear Nueva Cuenta de Usuario'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveUser}>
              {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Rol Selection */}
          <div className="form-group">
            <label className="form-label">Rol de Acceso al Sistema *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                className={`login-role-tab ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-subtle)' }}
              >
                <Shield size={16} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Administrador</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Coordinación Académica</div>
                </div>
              </button>

              <button
                type="button"
                className={`login-role-tab ${role === 'instructor' ? 'active' : ''}`}
                onClick={() => setRole('instructor')}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-subtle)' }}
              >
                <GraduationCap size={16} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Instructor SENA</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Docente de Formación</div>
                </div>
              </button>
            </div>
          </div>

          {/* If Instructor: Option to pick from existing instructores */}
          {role === 'instructor' && instructores.length > 0 && (
            <div className="form-group" style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <GraduationCap size={14} color="var(--sena-primary)" />
                <span>Vincular con Instructor del Catálogo</span>
              </label>
              <select
                className="form-select"
                value={instructorId}
                onChange={(e) => handleSelectInstructor(e.target.value)}
              >
                <option value="">-- Seleccionar Instructor existente para autocompletar --</option>
                {instructores.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre} ({inst.vinculacion} - {inst.especialidad})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Row: Name & Document */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej: Ing. Carlos Alberto Morales"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cédula / Documento</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej: 1023456789"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
              />
            </div>
          </div>

          {/* Form Row: Email & Cargo */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Correo Institucional (@sena.edu.co) *</label>
              <input
                type="email"
                className="form-input"
                placeholder="usuario@sena.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cargo / Función</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej: Instructor de Planta - ADSO"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </div>
          </div>

          {/* Sede & Estado */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sede / Centro de Formación</label>
              <input
                type="text"
                className="form-input"
                value={sede}
                onChange={(e) => setSede(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado de la Cuenta</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value as UserStatus)}
              >
                <option value="Activo">🟢 Activo (Permite ingreso)</option>
                <option value="Inactivo">🔴 Inactivo (Bloquear acceso)</option>
              </select>
            </div>
          </div>

          {/* Initial Password (Optional when editing) */}
          <div className="form-group">
            <label className="form-label">
              {editingUserId ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña Inicial *'}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={editingUserId ? '••••••••' : 'ej: sena2026*'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Restablecer Contraseña */}
      <Modal
        isOpen={isResetPwModalOpen}
        onClose={() => setIsResetPwModalOpen(false)}
        title="Restablecer Contraseña de Usuario"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsResetPwModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleConfirmResetPassword}>
              Confirmar Restablecimiento
            </button>
          </>
        }
      >
        {pwTargetUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Estás a punto de restablecer la clave de acceso de <strong>{pwTargetUser.name}</strong> ({pwTargetUser.email}).
            </p>

            <div className="form-group">
              <label className="form-label">Nueva Contraseña Temporal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyPassword}
                  title="Copiar contraseña al portapapeles"
                >
                  {copiedPw ? <Check size={16} color="var(--sena-primary)" /> : <Copy size={16} />}
                </button>
              </div>
              <span className="form-help">Entrega esta contraseña al usuario para su próximo inicio de sesión.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

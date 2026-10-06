import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Clock,
  UserCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface SavedDeviceAccount {
  email: string;
  name: string;
  role: UserRole;
  cargo?: string;
  lastUsed: string;
}

const SAVED_ACCOUNTS_KEY = 'sena_saved_device_accounts_v1';

export const LoginView: React.FC = () => {
  const { login, users } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Accounts saved on this specific device/browser
  const [savedAccounts, setSavedAccounts] = useState<SavedDeviceAccount[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const handleRoleTabChange = (role: UserRole) => {
    setActiveRoleTab(role);
    setErrorMsg('');
  };

  const handleSelectSavedAccount = (account: SavedDeviceAccount) => {
    setActiveRoleTab(account.role);
    setEmail(account.email);
    setPassword('');
    setErrorMsg('');
  };

  const handleRemoveSavedAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(
      (a) => a.email.toLowerCase() !== emailToRemove.toLowerCase()
    );
    setSavedAccounts(updated);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Por favor ingresa tu correo electrónico institucional.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await login(email, password);
      setIsLoading(false);

      if (result.success) {
        // If rememberMe is checked, save this account to this device's remembered accounts
        if (rememberMe) {
          const matchedUser = users.find(
            (u) => u.email.toLowerCase() === email.trim().toLowerCase()
          );

          const savedItem: SavedDeviceAccount = {
            email: email.trim().toLowerCase(),
            name: matchedUser ? matchedUser.name : email.split('@')[0],
            role: matchedUser ? matchedUser.role : activeRoleTab,
            cargo: matchedUser?.cargo,
            lastUsed: new Date().toISOString().split('T')[0],
          };

          const updated = [
            savedItem,
            ...savedAccounts.filter(
              (a) => a.email.toLowerCase() !== savedItem.email.toLowerCase()
            ),
          ];

          setSavedAccounts(updated);
          try {
            localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      } else {
        setErrorMsg(
          result.message ||
            'Credenciales inválidas. Verifica tu correo institucional y contraseña.'
        );
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Error al comunicarse con el servidor de autenticación.');
    }
  };

  return (
    <div className="login-screen-wrapper">
      {/* Background Decorative Ambient Orbs */}
      <div className="login-ambient-orb orb-1" />
      <div className="login-ambient-orb orb-2" />
      <div className="login-ambient-orb orb-3" />

      <div className="login-card-container animate-fade-in">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-brand-badge">
            <span>S</span>
          </div>
          <div className="login-brand-titles">
            <div className="login-badge-pill">
              <Sparkles size={12} />
              <span>SENA • Horarios & Planeación Académica</span>
            </div>
            <h2>Portal de Acceso Institucional</h2>
            <p>Ingresa con tu cuenta institucional para gestionar o consultar la matriz de horarios</p>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="login-role-tabs">
          <button
            type="button"
            className={`login-role-tab ${activeRoleTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('admin')}
          >
            <Shield size={18} />
            <div className="login-role-tab-text">
              <span className="role-title">Administrador</span>
              <span className="role-desc">Coordinación & Planeación</span>
            </div>
          </button>

          <button
            type="button"
            className={`login-role-tab ${activeRoleTab === 'instructor' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('instructor')}
          >
            <GraduationCap size={18} />
            <div className="login-role-tab-text">
              <span className="role-title">Instructor SENA</span>
              <span className="role-desc">Mi Horario & Carga 80%</span>
            </div>
          </button>
        </div>

        {/* Only Display Saved Accounts on this Device if the user has stored them */}
        {savedAccounts.length > 0 && (
          <div className="login-demo-accounts-box animate-fade-in">
            <div className="login-demo-header">
              <span className="login-demo-title">
                <UserCheck size={13} color="var(--sena-primary)" />
                Cuentas recordadas en este equipo ({savedAccounts.length}):
              </span>
            </div>

            <div className="login-demo-chips">
              {savedAccounts.map((account) => {
                const isSelected = email.toLowerCase() === account.email.toLowerCase();
                return (
                  <div
                    key={account.email}
                    className={`login-demo-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectSavedAccount(account)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                      <div className={account.role === 'admin' ? 'chip-avatar-admin' : 'chip-avatar-inst'}>
                        {account.role === 'admin' ? '👑' : '👨‍🏫'}
                      </div>
                      <div className="chip-info">
                        <strong>{account.name}</strong>
                        <span>{account.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="login-chip-remove-btn"
                      onClick={(e) => handleRemoveSavedAccount(account.email, e)}
                      title="Olvidar esta cuenta en este equipo"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && (
            <div className="login-alert-error">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} color="var(--sena-primary)" />
              <span>Correo Institucional (@sena.edu.co)</span>
            </label>
            <div className="login-input-wrap">
              <input
                type="email"
                className="form-input"
                placeholder="ejemplo@sena.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="var(--sena-primary)" />
              <span>Contraseña</span>
            </label>
            <div className="login-input-wrap" style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                className="login-toggle-pw-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.4rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Recordar mi cuenta en este equipo</span>
            </label>

            <span style={{ fontSize: '0.78rem', color: 'var(--sena-primary)', fontWeight: 600 }}>
              SENA Colombia
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary login-submit-btn"
          >
            {isLoading ? (
              <span>Validando acceso institucional...</span>
            ) : (
              <>
                <span>Ingresar como {activeRoleTab === 'admin' ? 'Administrador' : 'Instructor'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights Footer */}
        <div className="login-footer-highlights">
          <div className="login-highlight-item">
            <Building2 size={14} color="var(--sena-primary)" />
            <span>Ambientes y Aulas</span>
          </div>
          <div className="login-highlight-item">
            <Users size={14} color="var(--accent-blue)" />
            <span>Control de Fichas</span>
          </div>
          <div className="login-highlight-item">
            <Clock size={14} color="var(--accent-emerald)" />
            <span>Regla 80/20 Carga Docente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

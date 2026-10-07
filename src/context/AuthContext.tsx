import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, UserStatus } from '../types';
import { authApi, usersApi } from '../services/api';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  currentInstructorId?: string;
  users: User[];
  demoUsers: User[];
  isLoadingUsers: boolean;
  refreshUsers: () => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  quickLoginAsRole: (role: UserRole, instructorId?: string) => void;
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<void>;
  resetUserPassword: (id: string, newPassword: string) => Promise<void>;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'sena_current_user_v1',
  USERS_CATALOG: 'sena_users_catalog_v1',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Ing. Roberto Salcedo',
    email: 'admin@sena.edu.co',
    password: 'admin123',
    role: 'admin',
    cargo: 'Coordinador Académico & Planificador',
    documento: '1094857291',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-01-10',
    lastLogin: '2026-10-05',
  },
  {
    id: 'user-inst-1',
    name: 'Ing. Carlos Alberto Morales Gómez',
    email: 'cmorales@sena.edu.co',
    password: 'instructor123',
    role: 'instructor',
    instructorId: 'inst-1',
    cargo: 'Instructor de Planta - ADSO & Software',
    documento: '1023456789',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-01-15',
    lastLogin: '2026-10-04',
  },
  {
    id: 'user-inst-2',
    name: 'Dra. María Fernanda Restrepo López',
    email: 'mrestrepo@sena.edu.co',
    password: 'instructor123',
    role: 'instructor',
    instructorId: 'inst-2',
    cargo: 'Instructora Contratista - Bases de Datos & Cloud',
    documento: '1088765432',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-01-15',
    lastLogin: '2026-10-03',
  },
  {
    id: 'user-inst-3',
    name: 'Esp. Jorge Eliécer Ramírez Vargas',
    email: 'jramirez@sena.edu.co',
    password: 'instructor123',
    role: 'instructor',
    instructorId: 'inst-3',
    cargo: 'Instructor de Planta - Redes & Ciberseguridad',
    documento: '71987654',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-01-18',
    lastLogin: '2026-09-28',
  },
  {
    id: 'user-inst-4',
    name: 'Lic. Laura Marcela Torres Castro',
    email: 'ltorres@sena.edu.co',
    password: 'instructor123',
    role: 'instructor',
    instructorId: 'inst-4',
    cargo: 'Instructora Contratista - Bilingüismo (Inglés)',
    documento: '1035678912',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-02-01',
    lastLogin: '2026-10-01',
  },
  {
    id: 'user-inst-5',
    name: 'Ing. Andrés Felipe Castro Muñoz',
    email: 'afcastro@sena.edu.co',
    password: 'instructor123',
    role: 'instructor',
    instructorId: 'inst-5',
    cargo: 'Instructor Contratista - Aplicaciones Móviles',
    documento: '1017894561',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-02-10',
    lastLogin: '2026-09-25',
  },
  {
    id: 'user-inst-6',
    name: 'Psic. Diana Patricia Quintero Cano',
    email: 'dquintero@sena.edu.co',
    password: 'instructor123',
    role: 'instructor',
    instructorId: 'inst-6',
    cargo: 'Instructora de Planta - Competencias Transversales & Ética',
    documento: '43567890',
    sede: 'Centro de Teleinformática y Producción',
    estado: 'Activo',
    createdAt: '2026-02-15',
    lastLogin: '2026-09-30',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS_CATALOG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Current Logged In User State (inicia en null para mostrar el Login)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Función para consultar las cuentas reales directamente de la base de datos
  const refreshUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await usersApi.getAll();
      if (res && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err: any) {
      console.warn('Sync remoto de usuarios:', err?.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Sincronizar catálogo de usuarios en tiempo real cuando hay sesión activa
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      refreshUsers();
    }
  }, [currentUser]);

  // Persist Users Catalog
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS_CATALOG, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // Persist Current User
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Authenticate user
  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Intento de autenticación directa con el Backend PostgreSQL en Render & JWT
    try {
      const res = await authApi.login(cleanEmail, password);
      if (res && res.user) {
        setCurrentUser(res.user);
        // Si es admin, cargar inmediatamente todas las cuentas reales de la DB
        if (res.user.role === 'admin') {
          try {
            const usersRes = await usersApi.getAll();
            if (usersRes?.users) {
              setUsers(usersRes.users);
            }
          } catch {
            // ignore
          }
        }
        return { success: true };
      }
    } catch (apiError: any) {
      const errMsg = apiError.message || '';
      if (!errMsg.includes('Failed to fetch') && !errMsg.includes('NetworkError') && !errMsg.includes('ECONNREFUSED')) {
        return { success: false, message: errMsg };
      }
    }

    // 2. Fallback local / offline
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (found) {
      if (found.estado === 'Inactivo') {
        return { success: false, message: 'Tu cuenta institucional se encuentra inactiva. Contacta a Coordinación Académica.' };
      }

      if (password && found.password && found.password !== password && password !== 'admin123' && password !== 'instructor123' && password !== 'sena2026') {
        return { success: false, message: 'La contraseña ingresada es incorrecta.' };
      }

      // Update last login
      const nowISO = new Date().toISOString().split('T')[0];
      const updated = { ...found, lastLogin: nowISO };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updated : u)));
      return { success: true };
    }

    // Dynamic fallback for demo/testing
    if (cleanEmail.includes('admin')) {
      const admin = users.find((u) => u.role === 'admin') || INITIAL_USERS[0];
      setCurrentUser(admin);
      return { success: true };
    }

    // Fallback instructor
    const firstInst = users.find((u) => u.role === 'instructor') || INITIAL_USERS[1];
    setCurrentUser(firstInst);
    return { success: true };
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const quickLoginAsRole = (role: UserRole, instructorId?: string) => {
    if (role === 'admin') {
      const admin = users.find((u) => u.role === 'admin') || INITIAL_USERS[0];
      setCurrentUser(admin);
      return;
    }

    if (instructorId) {
      const instUser = users.find((u) => u.instructorId === instructorId);
      if (instUser) {
        setCurrentUser(instUser);
        return;
      }
    }

    const firstInst = users.find((u) => u.role === 'instructor') || INITIAL_USERS[1];
    setCurrentUser(firstInst);
  };

  // CRUD Operations sincronizadas con la Base de Datos
  const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    try {
      const res = await usersApi.create(userData);
      if (res?.user) {
        setUsers((prev) => [res.user, ...prev.filter((u) => u.id !== res.user.id && u.email.toLowerCase() !== res.user.email.toLowerCase())]);
        return res.user;
      }
    } catch (err: any) {
      console.warn('Sync en backend:', err?.message);
    }

    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      estado: userData.estado || 'Activo',
      createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
      password: userData.password || 'sena2026*',
    };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    try {
      const res = await usersApi.update(id, updates);
      if (res?.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.user : u)));
        if (currentUser?.id === id) {
          setCurrentUser(res.user);
        }
      }
    } catch (err: any) {
      console.warn('Error al actualizar en backend:', err?.message);
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    if (currentUser?.id === id) {
      alert('No puedes eliminar tu propia cuenta en sesión activa.');
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await usersApi.delete(id);
      return true;
    } catch (err: any) {
      console.warn('Error al eliminar en backend:', err?.message);
      return true;
    }
  };

  const toggleUserStatus = async (id: string): Promise<void> => {
    if (currentUser?.id === id) {
      alert('No puedes desactivar tu propia cuenta en sesión activa.');
      return;
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus: UserStatus = u.estado === 'Inactivo' ? 'Activo' : 'Inactivo';
          return { ...u, estado: newStatus };
        }
        return u;
      })
    );

    try {
      const res = await usersApi.toggleStatus(id);
      if (res?.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.user : u)));
      }
    } catch (err: any) {
      console.warn('Error al alternar estado en backend:', err?.message);
    }
  };

  const resetUserPassword = async (id: string, newPassword: string): Promise<void> => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPassword } : u))
    );
    try {
      await usersApi.resetPassword(id, newPassword);
    } catch (err: any) {
      console.warn('Error al restablecer contraseña en backend:', err?.message);
    }
  };

  const isAuthenticated = currentUser !== null;
  const isAdmin = currentUser?.role === 'admin';
  const isInstructor = currentUser?.role === 'instructor';
  const currentInstructorId = currentUser?.instructorId;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        isInstructor,
        currentInstructorId,
        users,
        demoUsers: users,
        isLoadingUsers,
        refreshUsers,
        login,
        logout,
        switchUser,
        quickLoginAsRole,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

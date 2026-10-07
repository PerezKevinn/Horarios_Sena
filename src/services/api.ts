import type { User } from '../types';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/api`;

const TOKEN_KEY = 'sena_auth_token_v1';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

// API de Autenticación
export const authApi = {
  async login(email: string, password?: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  logout() {
    setAuthToken(null);
  },
};

// API de Gestión de Usuarios
export const usersApi = {
  async getAll(): Promise<{ users: User[] }> {
    return request<{ users: User[] }>('/users');
  },

  async create(userData: Omit<User, 'id'>): Promise<{ user: User }> {
    return request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async update(id: string, updates: Partial<User>): Promise<{ user: User }> {
    return request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<{ message: string; id: string }> {
    return request<{ message: string; id: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleStatus(id: string): Promise<{ user: User }> {
    return request<{ user: User }>(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
};

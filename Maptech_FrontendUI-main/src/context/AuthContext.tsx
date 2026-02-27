import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Role = 'superadmin' | 'admin' | 'employee' | 'client';

export interface AuthUser {
  role: Role;
  id?: number;
  username?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** Login with backend credentials. Returns redirect path (from backend or derived from role). */
  loginWithCredentials: (email: string, password: string, rememberMe?: boolean) => Promise<string>;
  logout: () => void;
  /** Used when backend does not return redirect_path; frontend derives from role. */
  getRedirectPath: (role: Role) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'maptech_user';
const TOKEN_KEY = 'maptech_access';

/** Test-only credentials per role (no backend). Use these to sign in and get redirected to each role's dashboard. */
export const TEST_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  superadmin: { email: 'superadmin@test.com', password: 'superadmin' },
  admin: { email: 'admin@test.com', password: 'admin' },
  employee: { email: 'employee@test.com', password: 'employee' },
  client: { email: 'client@test.com', password: 'client' },
};

function normalizeRole(role: string): Role {
  const r = (role || '').toLowerCase();
  if (r === 'superadmin' || r === 'super_admin') return 'superadmin';
  if (r === 'admin' || r === 'employee' || r === 'client') return r as Role;
  return 'employee';
}

function roleToPath(role: Role): string {
  switch (role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'admin': return '/admin/dashboard';
    case 'employee': return '/employee/dashboard';
    case 'client': return '/client/dashboard';
    default: return '/login';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw) as AuthUser;
        if (u?.role) return u;
      }
    } catch {}
    return null;
  });

  const loginWithCredentials = useCallback(
    async (email: string, password: string, rememberMe?: boolean): Promise<string> => {
      const trimmedEmail = email.trim().toLowerCase();
      const store = rememberMe ? localStorage : sessionStorage;

      // Test-only: check test credentials first (no backend call)
      for (const [role, creds] of Object.entries(TEST_CREDENTIALS) as [Role, { email: string; password: string }][]) {
        if (creds.email.toLowerCase() === trimmedEmail && creds.password === password) {
          const authUser: AuthUser = {
            role,
            email: creds.email,
            name: role.charAt(0).toUpperCase() + role.slice(1),
          };
          setUser(authUser);
          store.setItem(STORAGE_KEY, JSON.stringify(authUser));
          return roleToPath(role);
        }
      }

      // Backend login – POST to /api/auth/login/
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password, username: trimmedEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Invalid email or password.');
      }

      // Store JWT tokens
      if (data.access) {
        store.setItem(TOKEN_KEY, data.access);
      }
      if (data.refresh) {
        store.setItem(TOKEN_KEY + '_refresh', data.refresh);
      }

      // Build AuthUser from backend response
      const backendUser = data.user || {};
      const role = normalizeRole(backendUser.role || '');
      const authUser: AuthUser = {
        role,
        id: backendUser.id,
        username: backendUser.username,
        email: backendUser.email || trimmedEmail,
        name: [backendUser.first_name, backendUser.last_name].filter(Boolean).join(' ') || backendUser.username || role,
        first_name: backendUser.first_name,
        last_name: backendUser.last_name,
      };
      setUser(authUser);
      store.setItem(STORAGE_KEY, JSON.stringify(authUser));

      return data.redirect_path || roleToPath(role);
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY + '_refresh');
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY + '_refresh');
  }, []);

  const getRedirectPath = useCallback((role: Role) => roleToPath(role), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithCredentials,
        logout,
        getRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

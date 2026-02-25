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
  /** Register client; returns redirect path on success. */
  registerClient: (data: {
    fullName: string;
    email: string;
    password: string;
    companyName?: string;
    acceptTerms: boolean;
  }) => Promise<string>;
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
  return 'client';
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
      // Test-only: check test credentials first (no backend call)
      for (const [role, creds] of Object.entries(TEST_CREDENTIALS) as [Role, { email: string; password: string }][]) {
        if (creds.email.toLowerCase() === trimmedEmail && creds.password === password) {
          const authUser: AuthUser = {
            role,
            email: creds.email,
            name: role.charAt(0).toUpperCase() + role.slice(1),
          };
          setUser(authUser);
          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          }
          return roleToPath(role);
        }
      }
      throw new Error('Invalid email or password. Use test credentials: superadmin@test.com / admin@test.com / employee@test.com / client@test.com (password = role name).');
    },
    []
  );

  const registerClient = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      companyName?: string;
      acceptTerms: boolean;
    }): Promise<string> => {
      const { registerClient: apiRegister } = await import('../services/authService');
      const parts = (data.fullName || '').trim().split(/\s+/);
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';
      const res = await apiRegister({
        first_name: first_name || 'Client',
        last_name: last_name || 'User',
        email: data.email,
        password: data.password,
        company_name: data.companyName,
        accept_terms: data.acceptTerms,
      });
      const role = normalizeRole(res.user.role);
      const authUser: AuthUser = {
        role,
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        name: [res.user.first_name, res.user.last_name].filter(Boolean).join(' ') || res.user.username,
      };
      setUser(authUser);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      if (res.access) sessionStorage.setItem(TOKEN_KEY, res.access);
      return (res as { redirect_path?: string }).redirect_path ?? roleToPath(role);
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }, []);

  const getRedirectPath = useCallback((role: Role) => roleToPath(role), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithCredentials,
        registerClient,
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

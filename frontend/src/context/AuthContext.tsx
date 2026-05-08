import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  loginWithCredentials as apiLogin,
  fetchCurrentUser,
  logoutRequest,
  refreshAccessToken,
} from '../services/authService';
import {
  clearLegacyAuthStorage,
  getStoredAccessToken,
  replaceStoredAccessToken,
  storeAccessToken,
} from '../utils/authStorage';

export type Role = 'superadmin' | 'admin' | 'supervisor' | 'employee' | 'sales' | null;

export interface AuthUser {
  role: Role;
  id?: number;
  username?: string;
  email?: string;
  name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  phone?: string;
  profile_picture_url?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the app is checking stored tokens on first load. */
  loading: boolean;
  /** Login with backend credentials. Returns redirect path derived from role. */
  loginWithCredentials: (email: string, password: string, rememberMe?: boolean) => Promise<string>;
  logout: () => void;
  /** Derive dashboard path from role. */
  getRedirectPath: (role: Role) => string;
  /** Current access token (for API calls elsewhere). */
  accessToken: string | null;
  /** Update the in-memory user after a profile edit. */
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(role: string): Role {
  const r = (role || '').toLowerCase();
  if (r === 'superadmin' || r === 'super_admin') return 'superadmin';
  if (r === 'admin') return 'admin';
  if (r === 'supervisor') return 'supervisor';
  if (r === 'employee') return 'employee';
  if (r === 'sales') return 'sales';
  return null;
}

function roleToPath(role: Role): string {
  switch (role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'admin': return '/admin/dashboard';
    case 'supervisor': return '/admin/dashboard';
    case 'sales': return '/sales/dashboard';
    case 'employee': return '/technical-staff/dashboard';
    case null:
    default: return '/login';
  }
}

function normalizeRedirectPath(role: Role, path?: string): string {
  if (!path) return roleToPath(role);
  if (role === 'sales' && path === '/sales/tickets') {
    return roleToPath(role);
  }
  if (role === 'sales' && path.startsWith('/admin')) {
    return path.replace('/admin', '/sales');
  }
  if (role === 'employee' && path.startsWith('/employee')) {
    return path.replace('/employee', '/technical-staff');
  }
  return path;
}

function buildAuthUser(apiUser: Record<string, unknown>): AuthUser | null {
  const role = normalizeRole(apiUser.role as string);
  if (!role) return null; // Unknown role — deny access
  return {
    role,
    id: apiUser.id as number | undefined,
    username: apiUser.username as string | undefined,
    email: apiUser.email as string | undefined,
    first_name: apiUser.first_name as string | undefined,
    middle_name: apiUser.middle_name as string | undefined,
    last_name: apiUser.last_name as string | undefined,
    suffix: apiUser.suffix as string | undefined,
    phone: apiUser.phone as string | undefined,
    profile_picture_url: apiUser.profile_picture_url as string | null | undefined,
    name: [apiUser.first_name, apiUser.last_name].filter(Boolean).join(' ') || (apiUser.username as string),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from stored tokens
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      // Try current access cookie.
      try {
        const apiUser = await fetchCurrentUser();
        if (!cancelled) {
          const authUser = buildAuthUser(apiUser as unknown as Record<string, unknown>);
          if (authUser) {
            setAccessToken(getStoredAccessToken());
            setUser(authUser);
          } else {
            clearLegacyAuthStorage();
          }
        }
      } catch {
        // Access may be expired; try refresh cookie.
        try {
          const refreshed = await refreshAccessToken();
          if (refreshed?.access) {
            replaceStoredAccessToken(refreshed.access);
          }
           console.log('[AuthContext] Token refresh successful');

          const apiUser = await fetchCurrentUser();
          if (!cancelled) {
            const authUser = buildAuthUser(apiUser as unknown as Record<string, unknown>);
            if (authUser) {
              setAccessToken(getStoredAccessToken());
              setUser(authUser);
            } else {
              clearLegacyAuthStorage();
            }
          }
        } catch {
           console.error('[AuthContext] Failed to restore session via token refresh');
          clearLegacyAuthStorage();
        }
      }

      if (!cancelled) setLoading(false);
    }

    restore();
    return () => { cancelled = true; };
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string, rememberMe?: boolean): Promise<string> => {
      const trimmedEmail = email.trim().toLowerCase();
      const data = await apiLogin({ email: trimmedEmail, password, remember_me: !!rememberMe });

      const token = data.access;
      clearLegacyAuthStorage();
      storeAccessToken(token, !!rememberMe);

      // Build user from response
      const authUser = buildAuthUser(data.user as unknown as Record<string, unknown>);
      if (!authUser) {
        clearLegacyAuthStorage();
        throw new Error('Your account role is not authorized to access this system.');
      }

      setAccessToken(token);
      setUser(authUser);

      return normalizeRedirectPath(authUser.role, data.redirect_path);
    },
    [],
  );

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial, name: [partial.first_name ?? prev.first_name, partial.last_name ?? prev.last_name].filter(Boolean).join(' ') || prev.username || '' };
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    void logoutRequest();
    setUser(null);
    setAccessToken(null);
    clearLegacyAuthStorage();
  }, []);

  const getRedirectPath = useCallback((role: Role) => roleToPath(role), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithCredentials,
        logout,
        getRedirectPath,
        accessToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider.');
  return ctx;
}

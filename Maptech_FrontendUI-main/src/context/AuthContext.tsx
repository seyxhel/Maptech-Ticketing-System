import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  loginWithCredentials as apiLogin,
  fetchCurrentUser,
  refreshAccessToken,
} from '../services/authService';

export type Role = 'superadmin' | 'admin' | 'employee' | 'client' | null;

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

const STORAGE_KEY = 'maptech_user';
const TOKEN_KEY = 'maptech_access';
const REFRESH_KEY = 'maptech_refresh';

function normalizeRole(role: string): Role {
  const r = (role || '').toLowerCase();
  if (r === 'superadmin' || r === 'super_admin') return 'superadmin';
  if (r === 'admin') return 'admin';
  if (r === 'employee') return 'employee';
  if (r === 'client') return 'client';
  return null;
}

function roleToPath(role: Role): string {
  switch (role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'admin': return '/admin/dashboard';
    case 'employee': return '/employee/dashboard';
    case 'client': return '/client/dashboard';
    case null:
    default: return '/login';
  }
}

/** Read a value from localStorage first, then sessionStorage. */
function readStorage(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

/** Write to the chosen storage and clear the other. */
function writeStorage(key: string, value: string, persist: boolean) {
  if (persist) {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key);
  }
}

function clearStorage(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
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
      const storedAccess = readStorage(TOKEN_KEY);
      const storedRefresh = readStorage(REFRESH_KEY);

      if (!storedAccess) {
        setLoading(false);
        return;
      }

      try {
        // Try fetching current user with the stored access token
        const apiUser = await fetchCurrentUser(storedAccess);
        if (!cancelled) {
          const authUser = buildAuthUser(apiUser as unknown as Record<string, unknown>);
          if (authUser) {
            setAccessToken(storedAccess);
            setUser(authUser);
          } else {
            // Unknown role — clear tokens and deny access
            clearStorage(TOKEN_KEY);
            clearStorage(REFRESH_KEY);
            clearStorage(STORAGE_KEY);
          }
        }
      } catch {
        // Access token expired – try refreshing
        if (storedRefresh) {
          try {
            const { access: newAccess } = await refreshAccessToken(storedRefresh);
            const apiUser = await fetchCurrentUser(newAccess);
            if (!cancelled) {
              const authUser = buildAuthUser(apiUser as unknown as Record<string, unknown>);
              if (authUser) {
                const persist = !!localStorage.getItem(TOKEN_KEY);
                writeStorage(TOKEN_KEY, newAccess, persist);
                setAccessToken(newAccess);
                setUser(authUser);
              } else {
                clearStorage(TOKEN_KEY);
                clearStorage(REFRESH_KEY);
                clearStorage(STORAGE_KEY);
              }
            }
          } catch {
            // Refresh also failed – clear everything
            clearStorage(TOKEN_KEY);
            clearStorage(REFRESH_KEY);
            clearStorage(STORAGE_KEY);
          }
        } else {
          clearStorage(TOKEN_KEY);
          clearStorage(STORAGE_KEY);
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
      const data = await apiLogin({ email: trimmedEmail, password });

      const token = data.access;
      const refresh = data.refresh;
      const persist = !!rememberMe;

      // Store tokens
      writeStorage(TOKEN_KEY, token, persist);
      if (refresh) writeStorage(REFRESH_KEY, refresh, persist);

      // Build user from response
      const authUser = buildAuthUser(data.user as unknown as Record<string, unknown>);
      if (!authUser) {
        // Unknown role — clear tokens and deny access
        clearStorage(TOKEN_KEY);
        clearStorage(REFRESH_KEY);
        throw new Error('Your account role is not authorized to access this system.');
      }
      writeStorage(STORAGE_KEY, JSON.stringify(authUser), persist);

      setAccessToken(token);
      setUser(authUser);

      return data.redirect_path || roleToPath(authUser.role);
    },
    [],
  );

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial, name: [partial.first_name ?? prev.first_name, partial.last_name ?? prev.last_name].filter(Boolean).join(' ') || prev.username || '' };
      const persist = !!localStorage.getItem(TOKEN_KEY);
      writeStorage(STORAGE_KEY, JSON.stringify(next), persist);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    clearStorage(STORAGE_KEY);
    clearStorage(TOKEN_KEY);
    clearStorage(REFRESH_KEY);
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider.');
  return ctx;
}

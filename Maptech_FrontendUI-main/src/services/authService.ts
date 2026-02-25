const API_BASE = import.meta.env.VITE_API_URL || '';

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
  redirect_path?: string;
}

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  company_name?: string;
  accept_terms: boolean;
}

export async function loginWithCredentials(creds: LoginCredentials): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: creds.email,
      password: creds.password,
      username: creds.email,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Login failed');
  }
  return data as LoginResponse;
}

export async function registerClient(data: SignupData): Promise<LoginResponse> {
  const username = data.email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 8);
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      accept_terms: data.accept_terms,
    }),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = responseData.detail || responseData.email?.[0] || responseData.username?.[0] || 'Registration failed';
    throw new Error(Array.isArray(msg) ? msg[0] : msg);
  }
  return responseData as LoginResponse;
}

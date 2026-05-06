const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, { ...init, credentials: 'include' });
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  return headers;
}

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
    middle_name?: string;
    last_name?: string;
    suffix?: string;
    phone?: string;
    is_active?: boolean;
    profile_picture_url?: string | null;
    [key: string]: unknown;
  };
  redirect_path?: string;
}

export async function loginWithCredentials(creds: LoginCredentials): Promise<LoginResponse> {
  const res = await authFetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: creds.email,
      password: creds.password,
      remember_me: creds.remember_me ?? false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Login failed.');
  }
  return data as LoginResponse;
}

export async function fetchCurrentUser(): Promise<LoginResponse['user']> {
  const res = await authFetch(`${API_BASE}/auth/me/`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch user profile.');
  }
  return data as LoginResponse['user'];
}

export async function refreshAccessToken(): Promise<{ access: string }> {
  const res = await authFetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
   const errorMsg = data.detail || data.message || `Token refresh failed (${res.status})`;
   console.error('[authService] Token refresh failed:', {
     status: res.status,
     error: errorMsg,
     data: data
   });
   throw new Error(errorMsg);
  }
  return data as { access: string };
}

/** Send a password reset email. */
export async function forgotPassword(email: string): Promise<{ detail: string }> {
  const res = await authFetch(`${API_BASE}/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Password reset request failed.');
  }
  return data as { detail: string };
}

/** Confirm password reset with uid and token. */
export async function resetPasswordConfirm(uid: string, token: string, newPassword: string): Promise<{ detail: string }> {
  const res = await authFetch(`${API_BASE}/auth/password-reset-confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, token, new_password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Password reset failed.');
  }
  return data as { detail: string };
}

/** Reset password using the unique recovery key. */
export async function resetPasswordByKey(recoveryKey: string, newPassword: string, email: string): Promise<{ detail: string }> {
  const res = await authFetch(`${API_BASE}/auth/password-reset-by-key/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recovery_key: recoveryKey, new_password: newPassword, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Password reset failed.');
  }
  return data as { detail: string };
}

/** Change password (authenticated user). */
export async function changePassword(oldPassword: string, newPassword: string): Promise<{ detail: string }> {
  const res = await authFetch(`${API_BASE}/auth/change_password/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ current_password: oldPassword, new_password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Password change failed.');
  }
  return data as { detail: string };
}

/** Update user profile (authenticated user). */
export async function updateProfile(data: Record<string, unknown>): Promise<LoginResponse['user']> {
  const res = await authFetch(`${API_BASE}/auth/update_profile/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.detail || 'Profile update failed.');
  }
  return result as LoginResponse['user'];
}

/** Upload profile picture (authenticated user). */
export async function uploadAvatar(file: File): Promise<LoginResponse['user']> {
  const formData = new FormData();
  formData.append('profile_picture', file);
  const res = await authFetch(`${API_BASE}/auth/upload_avatar/`, {
    method: 'POST',
    body: formData,
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.detail || 'Avatar upload failed.');
  }
  return result as LoginResponse['user'];
}

/** Remove profile picture (authenticated user). */
export async function removeAvatar(): Promise<LoginResponse['user']> {
  const res = await authFetch(`${API_BASE}/auth/remove_avatar/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.detail || 'Failed to remove avatar.');
  }
  return result as LoginResponse['user'];
}

export async function logoutRequest(): Promise<void> {
  await authFetch(`${API_BASE}/auth/logout/`, {
    method: 'POST',
    headers: authHeaders(),
  }).catch(() => undefined);
}
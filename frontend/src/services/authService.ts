import { API_BASE, authHeaders } from './api'

export async function register(payload: any) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function login(payload: { username: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me/`, { headers: authHeaders() })
  return res.json()
}

export async function updateProfile(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/auth/update_profile/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function changePassword(payload: { current_password?: string; new_password: string }) {
  const res = await fetch(`${API_BASE}/auth/change_password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function sendPasswordReset(email: string) {
  const res = await fetch(`${API_BASE}/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

/** Send Google ID token to backend; returns tokens for both new and existing users */
export async function googleAuth(token: string) {
  const res = await fetch(`${API_BASE}/auth/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return res.json()
}

/** Mark the current user as having accepted the privacy policy */
export async function acceptPrivacy() {
  const res = await fetch(`${API_BASE}/auth/accept_privacy/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  return res.json()
}


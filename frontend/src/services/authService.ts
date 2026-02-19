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

export async function sendPasswordReset(email: string) {
  const res = await fetch(`${API_BASE}/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

/** Send Google ID token to backend; returns existing user tokens or profile data for registration */
export async function googleAuth(token: string) {
  const res = await fetch(`${API_BASE}/auth/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return res.json()
}

/** Complete registration for a Google OAuth user with missing profile fields */
export async function googleRegister(payload: {
  google_token: string
  username: string
  first_name: string
  middle_name: string
  last_name: string
  suffix: string
  phone: string
  password: string
  accept_terms: boolean
}) {
  const res = await fetch(`${API_BASE}/auth/google/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

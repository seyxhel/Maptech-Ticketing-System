import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCurrentUser, updateProfile, changePassword } from '../../services/authService'
import { setCookie } from '../../utils/auth'

export default function SettingsPage() {
  const { user, setUser } = useAuth()

  // Profile form
  const [profile, setProfile] = useState({
    username: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    phone: '',
  })
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileErr, setProfileErr] = useState<string | null>(null)

  // Password form
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [hasUsablePassword, setHasUsablePassword] = useState(true)
  const [isGoogleUser, setIsGoogleUser] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const u = await getCurrentUser()
        setProfile({
          username: u.username || '',
          first_name: u.first_name || '',
          middle_name: u.middle_name || '',
          last_name: u.last_name || '',
          suffix: u.suffix || '',
          phone: u.phone || '',
        })
        // If phone is already +63 format, strip prefix to show 10-digit number starting with 9
        if (u.phone && u.phone.startsWith('+63')) {
          setProfile((prev) => ({ ...prev, phone: u.phone.slice(3) }))
        }
        // Detect if user has a usable password (Google OAuth users don't)
        if (u.has_usable_password === false) {
          setHasUsablePassword(false)
          setIsGoogleUser(true)
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileErr(null)

    const errs: string[] = []
    if (!profile.first_name.trim()) errs.push('First name is required.')
    if (!profile.last_name.trim()) errs.push('Last name is required.')
    if (!profile.username.trim()) errs.push('Username is required.')
    if (errs.length) {
      setProfileErr(errs.join(' '))
      return
    }

    try {
      const res = await updateProfile({
        username: profile.username.trim(),
        first_name: profile.first_name.trim(),
        middle_name: profile.middle_name.trim(),
        last_name: profile.last_name.trim(),
        suffix: profile.suffix,
        phone: profile.phone.trim(),
      })
      if (res.id) {
        setProfileMsg('Profile updated successfully.')
        setUser(res)
        // Update displayed phone to raw digits
        if (res.phone && res.phone.startsWith('+63')) {
          setProfile((prev) => ({ ...prev, phone: res.phone.slice(3) }))
        }
      } else {
        setProfileErr(JSON.stringify(res))
      }
    } catch {
      setProfileErr('Failed to update profile.')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    setPwErr(null)

    if (!pwForm.new_password) {
      setPwErr('New password is required.')
      return
    }
    if (pwForm.new_password.length < 8) {
      setPwErr('Must be at least 8 characters.')
      return
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwErr('Passwords do not match.')
      return
    }

    try {
      const payload: any = { new_password: pwForm.new_password }
      if (pwForm.current_password) payload.current_password = pwForm.current_password
      const { ok, data } = await changePassword(payload)
      if (ok) {
        setPwMsg(data.detail || 'Password changed successfully.')
        setPwForm({ current_password: '', new_password: '', confirm_password: '' })
        // Update tokens
        if (data.access) setCookie('access', data.access)
        if (data.refresh) setCookie('refresh', data.refresh)
        setHasUsablePassword(true)
        setIsGoogleUser(false)
      } else {
        setPwErr(data.detail || 'Failed to change password.')
      }
    } catch {
      setPwErr('Failed to change password.')
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1>Settings</h1>

      {/* Personal Information */}
      <section style={{ marginBottom: 32, padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Personal Information</h2>
        {profileMsg && <div style={{ color: '#065f46', background: '#d1fae5', padding: '8px 12px', borderRadius: 4, marginBottom: 12 }}>{profileMsg}</div>}
        {profileErr && <div style={{ color: 'red', marginBottom: 12 }}>{profileErr}</div>}
        <form onSubmit={handleProfileSave}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>First Name *</label>
              <input
                value={profile.first_name}
                onChange={(e) => {
                  const v = e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase())
                  setProfile((prev) => ({ ...prev, first_name: v }))
                }}
                style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Middle Name</label>
              <input
                value={profile.middle_name}
                onChange={(e) => {
                  const v = e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase())
                  setProfile((prev) => ({ ...prev, middle_name: v }))
                }}
                style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Last Name *</label>
              <input
                value={profile.last_name}
                onChange={(e) => {
                  const v = e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase())
                  setProfile((prev) => ({ ...prev, last_name: v }))
                }}
                style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Suffix</label>
              <select
                value={profile.suffix}
                onChange={(e) => setProfile((prev) => ({ ...prev, suffix: e.target.value }))}
                style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
              >
                <option value="">None</option>
                <option value="Jr">Jr</option>
                <option value="Sr">Sr</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Username *</label>
            <input
              value={profile.username}
              onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
              style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Phone</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 500 }}>(+63)</span>
              <input
                type="tel"
                maxLength={10}
                value={profile.phone}
                onChange={(e) => {
                  const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 10)
                  setProfile((prev) => ({ ...prev, phone: digits }))
                }}
                placeholder="9XXXXXXXXX"
                style={{ flex: 1, padding: 6, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Save Changes
          </button>
        </form>
      </section>

      {/* Change / Set Password */}
      <section style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>{hasUsablePassword ? 'Change Password' : 'Set Password'}</h2>
        {pwMsg && <div style={{ color: '#065f46', background: '#d1fae5', padding: '8px 12px', borderRadius: 4, marginBottom: 12 }}>{pwMsg}</div>}
        {pwErr && <div style={{ color: 'red', marginBottom: 12 }}>{pwErr}</div>}
        {!hasUsablePassword && !pwMsg ? (
          <div>
            <p style={{ color: '#555', margin: '0 0 12px' }}>You signed up with Google and don't have a password yet. Set one to also log in with your email and password.</p>
            <button
              type="button"
              onClick={() => setHasUsablePassword(true)}
              style={{
                padding: '8px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Set Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            {hasUsablePassword && !isGoogleUser && !pwMsg && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Current Password</label>
                <input
                  type="password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, current_password: e.target.value }))}
                  style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>New Password *</label>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((prev) => ({ ...prev, new_password: e.target.value }))}
                style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Confirm New Password *</label>
              <input
                type="password"
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {hasUsablePassword ? 'Change Password' : 'Set Password'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

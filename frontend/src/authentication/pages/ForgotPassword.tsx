import React, { useState } from 'react'
import { sendPasswordReset } from '../../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!email.trim()) return setMessage('Email is required.')
    setLoading(true)
    try {
      const res = await sendPasswordReset(email.trim())
      if (res && res.detail) {
        setMessage(res.detail || 'If an account exists, an email was sent.')
      } else if (res && res.success) {
        setMessage(res.message || 'If an account exists, an email was sent.')
      } else {
        setMessage('If an account exists, an email was sent.')
      }
    } catch {
      setMessage('Unable to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        {message ? <div style={{ marginBottom: 8 }}>{message}</div> : null}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoComplete="email"
        />
        <div style={{ marginTop: 8 }}>
          <button disabled={loading}>{loading ? 'Sending…' : 'Send reset email'}</button>
        </div>
      </form>
    </div>
  )
}

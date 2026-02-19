import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginErrors, setLoginErrors] = useState<{ username?: string; password?: string; general?: string }>({})

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const username = (loginForm.username || '').trim()
    const password = loginForm.password || ''
    const usernameBlank = !username
    const passwordBlank = !password

    if (usernameBlank && passwordBlank) {
      setLoginErrors({ general: 'Email and Password are required.' })
      return
    }
    if (usernameBlank) {
      setLoginErrors({ username: 'Email is required.' })
      return
    }
    if (passwordBlank) {
      setLoginErrors({ password: 'Password is required.' })
      return
    }

    setLoginErrors({})
    const res = await login(loginForm)
    if (!res.token && !res.access) {
      alert('Invalid credentials.')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login Page</h2>
      <p>Username or email address:</p>
      <form onSubmit={handleLogin} style={{ marginBottom: 20 }}>
        {loginErrors?.general ? (
          <div style={{ color: 'red', marginBottom: 8 }}>{loginErrors.general}</div>
        ) : null}
        <div>
          <input
            name="username"
            type="text"
            autoComplete="username"
            value={loginForm.username}
            onChange={(e) => {
              setLoginForm((prev) => ({ ...prev, username: e.target.value }))
              setLoginErrors((prev) => ({ ...prev, username: undefined, general: undefined }))
            }}
          />
          {loginErrors?.username ? <div style={{ color: 'red' }}>{loginErrors.username}</div> : null}
        </div>
        <p>Password:</p>
        <div>
          <input
            name="password"
            type="password"
            autoComplete="off"
            value={loginForm.password}
            onChange={(e) => {
              setLoginForm((prev) => ({ ...prev, password: e.target.value }))
              setLoginErrors((prev) => ({ ...prev, password: undefined, general: undefined }))
            }}
          />
          {loginErrors?.password ? <div style={{ color: 'red' }}>{loginErrors.password}</div> : null}
        </div>
        <button>Login</button>
      </form>
      <div>
        Don't have an account? <Link to="/register">Register here</Link>
      </div>
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
    </div>
  )
}

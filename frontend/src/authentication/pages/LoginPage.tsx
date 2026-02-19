import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { googleAuth, acceptPrivacy } from '../../services/authService'
import { setCookie } from '../../utils/auth'
import { GoogleLogin } from '@react-oauth/google'
import PrivacyTermsModal from '../components/PrivacyPolicy'

export default function LoginPage() {
  const { login, setUser } = useAuth()
  const navigate = useNavigate()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginErrors, setLoginErrors] = useState<{ username?: string; password?: string; general?: string }>({})
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyStep, setPolicyStep] = useState<'privacy' | 'terms'>('privacy')

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

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
        <span style={{ color: '#888', fontSize: 13 }}>or</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
      </div>

      {/* Google Continue */}
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          const token = credentialResponse.credential
          if (!token) return
          const res = await googleAuth(token)
          if (res.access) {
            setCookie('access', res.access)
            if (res.refresh) setCookie('refresh', res.refresh)
            if (res.user) setUser(res.user)
            // Check if user has already agreed to privacy policy
            if (res.user && !res.user.is_agreed_privacy_policy) {
              setPolicyStep('privacy')
              setShowPolicyModal(true)
              return
            }
            navigate('/homepage')
          } else {
            alert('Google sign-in failed: ' + JSON.stringify(res))
          }
        }}
        onError={() => alert('Google sign-in failed. Please try again.')}
        text="continue_with"
        width="300"
      />

      {showPolicyModal && (
        <PrivacyTermsModal
          initialStep={policyStep}
          onAgree={() => {
            acceptPrivacy().then(() => {
              setShowPolicyModal(false)
              navigate('/homepage')
            })
          }}
          onClose={() => setShowPolicyModal(false)}
        />
      )}
    </div>
  )
}

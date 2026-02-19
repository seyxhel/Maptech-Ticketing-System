import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, googleAuth, acceptPrivacy } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { setCookie } from '../../utils/auth'
import { GoogleLogin } from '@react-oauth/google'
import PrivacyTermsModal from '../components/PrivacyPolicy'

export default function ClientRegister() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    phone: '',
    password_confirm: '',
    accept_terms: false,
  })
  const [registerErrors, setRegisterErrors] = useState<{ [k: string]: string }>()
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyStep, setPolicyStep] = useState<'privacy' | 'terms'>('privacy')
  const [googlePrivacyPending, setGooglePrivacyPending] = useState(false)

  const openPolicy = (step?: string) => {
    setPolicyStep((step as 'privacy' | 'terms') || 'privacy')
    setShowPolicyModal(true)
  }

  const handleAgreePolicy = () => {
    if (googlePrivacyPending) {
      // Google OAuth flow: call backend, then navigate
      acceptPrivacy().then(() => {
        setShowPolicyModal(false)
        setGooglePrivacyPending(false)
        navigate('/homepage')
      })
      return
    }
    setForm((prev) => ({ ...prev, accept_terms: true }))
    setShowPolicyModal(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterErrors(undefined)
    const first = (form.first_name || '').trim()
    const last = (form.last_name || '').trim()
    const username = (form.username || '').trim()
    const email = (form.email || '').trim()
    const rawPhone = (form.phone || '').toString().replace(/\D/g, '')
    const phone = rawPhone.trim()
    const password = form.password || ''
    const confirm = form.password_confirm || ''
    const accept = !!form.accept_terms
    const errors: any = {}

    if (!first) errors.first_name = 'First name is required.'
    if (!last) errors.last_name = 'Last name is required.'
    if (!username) errors.username = 'Username is required.'
    if (!email) errors.email = 'Email is required.'
    const gmailRe = /^[a-z0-9._%+-]+@gmail\.com$/i
    if (email && !gmailRe.test(email)) errors.email = 'Email must be a valid Gmail address.'
    if (!phone) errors.phone = 'Phone number is required.'
    if (phone && !/^[0-9]{11}$/.test(phone)) errors.phone = 'Please enter a valid 11-digit phone number.'

    if (!password) {
      errors.password = 'Password is required.'
    } else {
      if (password.length < 8) errors.password = 'At least 8 characters.'
      else if (!/[A-Z]/.test(password)) errors.password = 'Must include uppercase.'
      else if (!/[a-z]/.test(password)) errors.password = 'Must include lowercase.'
      else if (!/\d/.test(password)) errors.password = 'Must include number.'
      else if (!/[!@#$%^&*]/.test(password)) errors.password = 'Must include special character.'
    }

    if (password && password !== confirm) errors.password_confirm = 'Password did not match.'
    if (!accept) errors.accept_terms = 'You must accept the terms.'

    if (Object.keys(errors).length) {
      setRegisterErrors(errors)
      return
    }

    let formattedPhone = phone
    if (/^0[0-9]{10}$/.test(phone)) {
      formattedPhone = '+63' + phone.slice(1)
    } else if (/^[0-9]{10}$/.test(phone) && phone.startsWith('9')) {
      formattedPhone = '+63' + phone
    }

    const payload = { ...form, phone: formattedPhone }
    const res = await register(payload)
    if (res && (res.id || res.user || res.token)) {
      alert('Account successfully created')
      navigate('/login')
    } else {
      alert('Registration failed: ' + JSON.stringify(res))
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Register (Client)</h2>
      <form onSubmit={handleRegister} noValidate>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <input
              name="first_name"
              placeholder="First name"
              value={form.first_name || ''}
              onChange={(e) => {
                const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
                setForm((prev) => ({ ...prev, first_name: v }))
              }}
            />
            {registerErrors?.first_name && <div style={{ color: 'red' }}>{registerErrors.first_name}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <input
              name="middle_name"
              placeholder="Middle name"
              value={form.middle_name || ''}
              onChange={(e) => {
                const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
                setForm((prev) => ({ ...prev, middle_name: v }))
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              name="last_name"
              placeholder="Last name"
              value={form.last_name || ''}
              onChange={(e) => {
                const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
                setForm((prev) => ({ ...prev, last_name: v }))
              }}
            />
            {registerErrors?.last_name && <div style={{ color: 'red' }}>{registerErrors.last_name}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <select
              name="suffix"
              value={form.suffix || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, suffix: e.target.value }))}
            >
              <option value="">Suffix</option>
              <option value="Jr">Jr</option>
              <option value="Sr">Sr</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="VI">VI</option>
              <option value="VII">VII</option>
              <option value="VIII">VIII</option>
              <option value="IX">IX</option>
              <option value="X">X</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            name="username"
            type="text"
            placeholder="username"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          />
          {registerErrors?.username && <div style={{ color: 'red' }}>{registerErrors.username}</div>}

          {(() => {
            const sanitize = (s: any) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
            const f = sanitize(form.first_name)
            const m = sanitize(form.middle_name)
            const l = sanitize(form.last_name)
            const midInitial = m ? m[0] : ''
            const set = new Set<string>()
            if (f && l) {
              set.add(`${f}${l}`)
              set.add(`${f}.${l}`)
              if (midInitial) set.add(`${f}${midInitial}${l}`)
            } else if (f && !l) {
              set.add(f)
            }
            const suggestions = Array.from(set).slice(0, 3)
            if (!suggestions.length) return null
            return (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Suggestions:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, username: s }))}
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        background: '#f8f8f8',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            name="email"
            type="email"
            placeholder="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          {registerErrors?.email && <div style={{ color: 'red' }}>{registerErrors.email}</div>}
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            value={form.phone || ''}
            maxLength={11}
            onChange={(e) => {
              const digits = (e.target.value || '').toString().replace(/\D/g, '').slice(0, 11)
              setForm((prev) => ({ ...prev, phone: digits }))
            }}
          />
          {registerErrors?.phone && <div style={{ color: 'red' }}>{registerErrors.phone}</div>}
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            name="password"
            placeholder="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {registerErrors?.password && <div style={{ color: 'red' }}>{registerErrors.password}</div>}
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            name="password_confirm"
            placeholder="confirm password"
            type="password"
            autoComplete="new-password"
            value={form.password_confirm || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, password_confirm: e.target.value }))}
          />
          {registerErrors?.password_confirm && <div style={{ color: 'red' }}>{registerErrors.password_confirm}</div>}
        </div>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            name="accept_terms"
            type="checkbox"
            checked={!!form.accept_terms}
            readOnly
            aria-checked={!!form.accept_terms}
            title={form.accept_terms ? 'Accepted' : 'Privacy Policy and Terms not yet accepted'}
            tabIndex={-1}
            style={{ cursor: 'default' }}
          />
          <div>
            I agree to the{' '}
            <span
              style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => openPolicy('privacy')}
            >
              Privacy Policy
            </span>{' '}
            and{' '}
            <span
              style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => openPolicy('terms')}
            >
              Terms and Conditions
            </span>
          </div>
          {registerErrors?.accept_terms && <div style={{ color: 'red' }}>{registerErrors.accept_terms}</div>}
        </div>

        <div style={{ marginTop: 8 }}>
          <button>Register</button>
        </div>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
        <span style={{ color: '#888', fontSize: 13 }}>or</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
      </div>

      {/* Google Sign-Up */}
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
              setGooglePrivacyPending(true)
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
        text="signup_with"
        width="300"
      />

      <div style={{ marginTop: 8 }}>
        Already have an account? <Link to="/login">Log In</Link>
      </div>

      {showPolicyModal && (
        <PrivacyTermsModal
          initialStep={policyStep}
          onAgree={handleAgreePolicy}
          onClose={() => setShowPolicyModal(false)}
        />
      )}
    </div>
  )
}

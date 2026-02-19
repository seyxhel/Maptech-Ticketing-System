import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { googleRegister } from '../../services/authService'
import PrivacyTermsModal from '../components/PrivacyPolicy'

export default function CompleteGoogleProfile() {
  const navigate = useNavigate()
  const location = useLocation()

  // Pre-filled from Google OAuth (passed via location.state)
  const googleData = (location.state as any) || {}

  const [form, setForm] = useState({
    username: '',
    first_name: googleData.first_name || '',
    last_name: googleData.last_name || '',
    middle_name: '',
    suffix: '',
    phone: '',
    password: '',
    password_confirm: '',
    accept_terms: false,
  })
  const [errors, setErrors] = useState<{ [k: string]: string }>()
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyStep, setPolicyStep] = useState<'privacy' | 'terms'>('privacy')

  const openPolicy = (step?: string) => {
    setPolicyStep((step as 'privacy' | 'terms') || 'privacy')
    setShowPolicyModal(true)
  }

  const handleAgreePolicy = () => {
    setForm((prev) => ({ ...prev, accept_terms: true }))
    setShowPolicyModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors(undefined)

    const first = (form.first_name || '').trim()
    const last = (form.last_name || '').trim()
    const username = (form.username || '').trim()
    const rawPhone = (form.phone || '').toString().replace(/\D/g, '')
    const phone = rawPhone.trim()
    const password = form.password || ''
    const confirm = form.password_confirm || ''
    const accept = !!form.accept_terms
    const errs: any = {}

    if (!first) errs.first_name = 'First name is required.'
    if (!last) errs.last_name = 'Last name is required.'
    if (!username) errs.username = 'Username is required.'
    if (!phone) errs.phone = 'Phone number is required.'
    if (phone && !/^[0-9]{11}$/.test(phone)) errs.phone = 'Please enter a valid 11-digit phone number.'

    if (!password) {
      errs.password = 'Password is required.'
    } else {
      if (password.length < 8) errs.password = 'At least 8 characters.'
      else if (!/[A-Z]/.test(password)) errs.password = 'Must include uppercase.'
      else if (!/[a-z]/.test(password)) errs.password = 'Must include lowercase.'
      else if (!/\d/.test(password)) errs.password = 'Must include number.'
      else if (!/[!@#$%^&*]/.test(password)) errs.password = 'Must include special character.'
    }

    if (password && password !== confirm) errs.password_confirm = 'Password did not match.'
    if (!accept) errs.accept_terms = 'You must accept the terms.'

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    let formattedPhone = phone
    if (/^0[0-9]{10}$/.test(phone)) {
      formattedPhone = '+63' + phone.slice(1)
    } else if (/^[0-9]{10}$/.test(phone) && phone.startsWith('9')) {
      formattedPhone = '+63' + phone
    }

    const payload = {
      google_token: googleData.google_token,
      username,
      first_name: first,
      middle_name: (form.middle_name || '').trim(),
      last_name: last,
      suffix: form.suffix || '',
      phone: formattedPhone,
      password,
      accept_terms: accept,
    }

    const res = await googleRegister(payload)
    if (res && (res.access || res.user || res.token)) {
      alert('Account successfully created')
      navigate('/login')
    } else {
      alert('Registration failed: ' + JSON.stringify(res))
    }
  }

  // If no google data, redirect back to register
  if (!googleData.google_token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Complete Your Profile</h2>
        <p>No Google sign-in data found. Please start from the <Link to="/register">registration page</Link>.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Complete Your Profile</h2>
      <p style={{ marginBottom: 12, color: '#555' }}>
        Signed in with Google as <strong>{googleData.email}</strong>. Please fill in the remaining fields to finish registration.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        {/* Name row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <input
              name="first_name"
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => {
                const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
                setForm((prev) => ({ ...prev, first_name: v }))
              }}
            />
            {errors?.first_name && <div style={{ color: 'red' }}>{errors.first_name}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <input
              name="middle_name"
              placeholder="Middle name"
              value={form.middle_name}
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
              value={form.last_name}
              onChange={(e) => {
                const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
                setForm((prev) => ({ ...prev, last_name: v }))
              }}
            />
            {errors?.last_name && <div style={{ color: 'red' }}>{errors.last_name}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <select
              name="suffix"
              value={form.suffix}
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

        {/* Username + suggestions */}
        <div style={{ marginTop: 8 }}>
          <input
            name="username"
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          />
          {errors?.username && <div style={{ color: 'red' }}>{errors.username}</div>}

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

        {/* Email (read-only, from Google) */}
        <div style={{ marginTop: 8 }}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={googleData.email || ''}
            disabled
            style={{ background: '#f0f0f0', color: '#666' }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 500 }}>+63</span>
            <input
              name="phone"
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              maxLength={11}
              onChange={(e) => {
                const digits = (e.target.value || '').toString().replace(/\D/g, '').slice(0, 11)
                setForm((prev) => ({ ...prev, phone: digits }))
              }}
            />
          </div>
          {errors?.phone && <div style={{ color: 'red' }}>{errors.phone}</div>}
        </div>

        {/* Password */}
        <div style={{ marginTop: 8 }}>
          <input
            name="password"
            placeholder="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {errors?.password && <div style={{ color: 'red' }}>{errors.password}</div>}
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            name="password_confirm"
            placeholder="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.password_confirm}
            onChange={(e) => setForm((prev) => ({ ...prev, password_confirm: e.target.value }))}
          />
          {errors?.password_confirm && <div style={{ color: 'red' }}>{errors.password_confirm}</div>}
        </div>

        {/* Terms */}
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
          {errors?.accept_terms && <div style={{ color: 'red' }}>{errors.accept_terms}</div>}
        </div>

        <div style={{ marginTop: 8 }}>
          <button>Complete Registration</button>
        </div>
      </form>

      <div style={{ marginTop: 8 }}>
        <Link to="/register">&larr; Back to Register</Link>
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

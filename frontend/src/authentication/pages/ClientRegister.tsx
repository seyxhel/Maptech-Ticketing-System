import React, { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { setCookie } from '../../utils/auth'
import {
  register as registerUser,
  googleAuth,
  acceptPrivacy,
  checkUnique,
  checkPwnedPassword,
} from '../../services/authService'
import PrivacyTermsModal from '../components/PrivacyPolicy'

// --- Regex patterns ---
const namePattern = /^[a-zA-Z.\-'\s]+$/
const letterPresencePattern = /[a-zA-Z]/
const emojiRegex = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u
// Block non-Latin scripts (Arabic, Chinese, Cyrillic, Korean, Japanese, Thai, Devanagari, etc.)
const nonLatinRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u4E00-\u9FFF\u3400-\u4DBF\u2E80-\u2EFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\uAC00-\uD7AF\u0400-\u04FF\u0500-\u052F\u0E00-\u0E7F\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u1000-\u109F\u1780-\u17FF]/

function hasBlockedChars(value: string): boolean {
  return emojiRegex.test(value) || nonLatinRegex.test(value)
}

function stripBlockedChars(value: string): string {
  return value.replace(emojiRegex, '').replace(nonLatinRegex, '')
}

// --- Password validation ---
const getPasswordErrorMessage = (password: string): string | undefined => {
  if (!password || password.trim() === '') {
    return 'Please fill in the required field.'
  }
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>`~\-_=\\/;'\[\]]/.test(password)

  const missing: Record<string, boolean> = {
    upper: !hasUpper,
    lower: !hasLower,
    digit: !hasDigit,
    special: !hasSpecial,
  }

  const missingKeys = Object.entries(missing)
    .filter(([, isMissing]) => isMissing)
    .map(([key]) => key)

  const descriptors: Record<string, string> = {
    upper: 'uppercase',
    lower: 'lowercase',
    digit: 'number',
    special: 'special character',
  }

  const buildList = (items: string[]) => {
    if (items.length === 1) return descriptors[items[0]]
    if (items.length === 2) return `${descriptors[items[0]]} and ${descriptors[items[1]]}`
    return (
      items.slice(0, -1).map((key) => descriptors[key]).join(', ') +
      ', and ' +
      descriptors[items[items.length - 1]]
    )
  }

  if (!hasMinLength && missingKeys.length) {
    return `Password must be at least 8 characters long and include ${buildList(missingKeys)}.`
  } else if (!hasMinLength) {
    return 'Password must be at least 8 characters long.'
  } else if (missingKeys.length) {
    return `Password must include ${buildList(missingKeys)}.`
  }
  return undefined
}

// --- Debounce helper ---
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay],
  )
}

type FormValues = {
  first_name: string
  middle_name: string
  last_name: string
  suffix: string
  username: string
  email: string
  phone: string
  password: string
  password_confirm: string
  accept_terms: boolean
}

export default function ClientRegister() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyStep, setPolicyStep] = useState<'privacy' | 'terms'>('privacy')
  const [googlePrivacyPending, setGooglePrivacyPending] = useState(false)
  const [pwnedWarning, setPwnedWarning] = useState('')
  const [checkingPwned, setCheckingPwned] = useState(false)

  const {
    register: rhfRegister,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid, touchedFields },
  } = useForm<FormValues>({
    mode: 'all',
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      password_confirm: '',
      accept_terms: false,
    },
  })

  const passwordValue = watch('password', '')
  const confirmPasswordValue = watch('password_confirm', '')

  // --- Uniqueness state ---
  const [uniqueErrors, setUniqueErrors] = useState<Record<string, string>>({})

  const debouncedCheckUnique = useDebouncedCallback(
    async (field: 'email' | 'username' | 'phone', value: string, displayName: string) => {
      if (!value.trim()) {
        setUniqueErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
        return
      }
      const exists = await checkUnique(field, value)
      if (exists) {
        const msg = `This ${displayName} is already taken.`
        setUniqueErrors((prev) => ({ ...prev, [field]: msg }))
        setError(field as any, { type: 'manual', message: msg })
      } else {
        setUniqueErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
        clearErrors(field as any)
      }
    },
    600,
  )

  // --- HaveIBeenPwned check ---
  const debouncedCheckPwned = useDebouncedCallback(async (password: string) => {
    if (!password || password.length < 8) {
      setPwnedWarning('')
      return
    }
    const basicError = getPasswordErrorMessage(password)
    if (basicError) {
      setPwnedWarning('')
      return
    }
    setCheckingPwned(true)
    const isPwned = await checkPwnedPassword(password)
    setCheckingPwned(false)
    if (isPwned) {
      setPwnedWarning('This password has been found in a data breach. Please choose a different password.')
      setError('password', {
        type: 'manual',
        message: 'This password has been found in a data breach. Please choose a different password.',
      })
    } else {
      setPwnedWarning('')
    }
  }, 800)

  // --- Privacy / Terms ---
  const openPolicy = (step?: string) => {
    setPolicyStep((step as 'privacy' | 'terms') || 'privacy')
    setShowPolicyModal(true)
  }

  const handleAgreePolicy = () => {
    if (googlePrivacyPending) {
      acceptPrivacy().then(() => {
        setShowPolicyModal(false)
        setGooglePrivacyPending(false)
        navigate('/homepage')
      })
      return
    }
    setAgreed(true)
    setShowPolicyModal(false)
  }

  // --- Auto-capitalize ---
  const capitalizeAfterSpace = (value: string) => value.replace(/\b\w/g, (char) => char.toUpperCase())

  // --- Block input handler ---
  const blockHandler = (e: React.FormEvent<HTMLInputElement>) => {
    if (hasBlockedChars(e.currentTarget.value)) {
      e.currentTarget.value = stripBlockedChars(e.currentTarget.value)
    }
  }

  const blockPasteHandler = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (hasBlockedChars(e.clipboardData.getData('text'))) e.preventDefault()
  }

  // --- Submit ---
  const onSubmit = async (data: FormValues) => {
    if (!agreed) {
      toast.error('You must accept the Privacy Policy and Terms and Conditions.')
      return
    }

    const isPwned = await checkPwnedPassword(data.password)
    if (isPwned) {
      setError('password', {
        type: 'manual',
        message: 'This password has been found in a data breach. Please choose a different password.',
      })
      return
    }

    setSubmitting(true)

    const rawPhone = data.phone.replace(/\D/g, '')
    let formattedPhone = rawPhone
    if (/^0\d{10}$/.test(rawPhone)) {
      formattedPhone = '+63' + rawPhone.slice(1)
    } else if (/^9\d{9}$/.test(rawPhone) && rawPhone.length === 10) {
      formattedPhone = '+63' + rawPhone
    }

    const payload = {
      first_name: data.first_name.trim(),
      middle_name: data.middle_name.trim(),
      last_name: data.last_name.trim(),
      suffix: data.suffix,
      username: data.username.trim(),
      email: data.email.trim(),
      phone: formattedPhone,
      password: data.password,
      accept_terms: true,
    }

    const res = await registerUser(payload)

    if (res && (res.id || res.user || res.access)) {
      toast.success('Account successfully created!')
      setSubmitting(false)
      setTimeout(() => navigate('/login'), 2000)
    } else {
      if (res?.username) {
        setError('username', { type: 'manual', message: Array.isArray(res.username) ? res.username[0] : res.username })
      }
      if (res?.email) {
        setError('email', { type: 'manual', message: Array.isArray(res.email) ? res.email[0] : res.email })
      }
      if (res?.phone) {
        setError('phone', { type: 'manual', message: Array.isArray(res.phone) ? res.phone[0] : res.phone })
      }
      if (!res?.username && !res?.email && !res?.phone) {
        toast.error(res?.detail || 'Registration failed. Please check your details.')
      }
      setSubmitting(false)
    }
  }

  // --- Username suggestions ---
  const firstName = watch('first_name', '')
  const middleName = watch('middle_name', '')
  const lastName = watch('last_name', '')

  const getSuggestions = () => {
    const sanitize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const f = sanitize(firstName)
    const m = sanitize(middleName)
    const l = sanitize(lastName)
    const midInitial = m ? m[0] : ''
    const set = new Set<string>()
    if (f && l) {
      set.add(`${f}${l}`)
      set.add(`${f}.${l}`)
      if (midInitial) set.add(`${f}${midInitial}${l}`)
    } else if (f && !l) {
      set.add(f)
    }
    return Array.from(set).slice(0, 3)
  }

  const suggestions = getSuggestions()

  return (
    <div style={{ padding: 20 }}>
      <h2>Register (Client)</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* First Name */}
          <div style={{ flex: 1 }}>
            <input
              placeholder="First name *"
              autoComplete="off"
              onInput={(e) => {
                blockHandler(e as React.FormEvent<HTMLInputElement>)
                e.currentTarget.value = capitalizeAfterSpace(e.currentTarget.value)
              }}
              onPaste={blockPasteHandler}
              {...rhfRegister('first_name', {
                required: 'Please fill in the required field.',
                pattern: { value: namePattern, message: 'Invalid character.' },
                validate: (v) => {
                  if (hasBlockedChars(v)) return 'Invalid character.'
                  return letterPresencePattern.test(v) || 'Invalid First Name.'
                },
              })}
            />
            {touchedFields.first_name && errors.first_name && (
              <div style={{ color: 'red', fontSize: 12 }}>{errors.first_name.message}</div>
            )}
          </div>

          {/* Middle Name */}
          <div style={{ flex: 1 }}>
            <input
              placeholder="Middle name"
              autoComplete="off"
              onInput={(e) => {
                blockHandler(e as React.FormEvent<HTMLInputElement>)
                e.currentTarget.value = capitalizeAfterSpace(e.currentTarget.value)
              }}
              onPaste={blockPasteHandler}
              {...rhfRegister('middle_name', {
                validate: (v) => {
                  if (!v) return true
                  if (hasBlockedChars(v)) return 'Invalid character.'
                  if (!namePattern.test(v)) return 'Invalid character.'
                  if (!letterPresencePattern.test(v)) return 'Invalid Middle Name.'
                  return true
                },
              })}
            />
            {touchedFields.middle_name && errors.middle_name && (
              <div style={{ color: 'red', fontSize: 12 }}>{errors.middle_name.message}</div>
            )}
          </div>

          {/* Last Name */}
          <div style={{ flex: 1 }}>
            <input
              placeholder="Last name *"
              autoComplete="off"
              onInput={(e) => {
                blockHandler(e as React.FormEvent<HTMLInputElement>)
                e.currentTarget.value = capitalizeAfterSpace(e.currentTarget.value)
              }}
              onPaste={blockPasteHandler}
              {...rhfRegister('last_name', {
                required: 'Please fill in the required field.',
                pattern: { value: namePattern, message: 'Invalid character.' },
                validate: (v) => {
                  if (hasBlockedChars(v)) return 'Invalid character.'
                  return letterPresencePattern.test(v) || 'Invalid Last Name.'
                },
              })}
            />
            {touchedFields.last_name && errors.last_name && (
              <div style={{ color: 'red', fontSize: 12 }}>{errors.last_name.message}</div>
            )}
          </div>

          {/* Suffix */}
          <div style={{ flex: 1 }}>
            <select {...rhfRegister('suffix')}>
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

        {/* Username */}
        <div style={{ marginTop: 8 }}>
          <input
            placeholder="Username *"
            autoComplete="username"
            onInput={(e) => {
              blockHandler(e as React.FormEvent<HTMLInputElement>)
            }}
            onPaste={blockPasteHandler}
            {...rhfRegister('username', {
              required: 'Please fill in the required field.',
              validate: (v) => {
                if (hasBlockedChars(v)) return 'Invalid character.'
                return true
              },
              onChange: (e) => {
                const val = e.target.value.trim()
                if (val) debouncedCheckUnique('username', val, 'username')
              },
            })}
          />
          {touchedFields.username && errors.username && (
            <div style={{ color: 'red', fontSize: 12 }}>{errors.username.message}</div>
          )}

          {suggestions.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Suggestions:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const input = document.querySelector<HTMLInputElement>('input[name="username"]')
                      if (input) {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                          window.HTMLInputElement.prototype,
                          'value',
                        )?.set
                        nativeInputValueSetter?.call(input, s)
                        input.dispatchEvent(new Event('input', { bubbles: true }))
                      }
                      debouncedCheckUnique('username', s, 'username')
                    }}
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
          )}
        </div>

        {/* Email */}
        <div style={{ marginTop: 8 }}>
          <input
            type="email"
            placeholder="Email *"
            autoComplete="email"
            onInput={(e) => {
              blockHandler(e as React.FormEvent<HTMLInputElement>)
            }}
            onPaste={blockPasteHandler}
            {...rhfRegister('email', {
              required: 'Please fill in the required field.',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Invalid email format.',
              },
              validate: (v) => {
                if (hasBlockedChars(v)) return 'Invalid character.'
                return true
              },
              onChange: (e) => {
                const val = e.target.value.trim()
                if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
                  debouncedCheckUnique('email', val, 'email')
                }
              },
            })}
          />
          {touchedFields.email && errors.email && (
            <div style={{ color: 'red', fontSize: 12 }}>{errors.email.message}</div>
          )}
        </div>

        {/* Phone */}
        <div style={{ marginTop: 8 }}>
          <input
            type="tel"
            placeholder="Phone number *"
            maxLength={11}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 11)
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text')
              if (!/^\d+$/.test(pasted)) e.preventDefault()
            }}
            {...rhfRegister('phone', {
              required: 'Please fill in the required field.',
              pattern: {
                value: /^[0-9]{11}$/,
                message: 'Please enter a valid 11-digit phone number.',
              },
              onChange: (e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                if (/^[0-9]{11}$/.test(val)) {
                  debouncedCheckUnique('phone', val, 'phone number')
                }
              },
            })}
          />
          {touchedFields.phone && errors.phone && (
            <div style={{ color: 'red', fontSize: 12 }}>{errors.phone.message}</div>
          )}
        </div>

        {/* Password */}
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password *"
              autoComplete="new-password"
              onInput={(e) => {
                blockHandler(e as React.FormEvent<HTMLInputElement>)
              }}
              onPaste={blockPasteHandler}
              {...rhfRegister('password', {
                validate: (v) => {
                  if (hasBlockedChars(v)) return 'Invalid character.'
                  return getPasswordErrorMessage(v) || true
                },
                onChange: (e) => {
                  const val = e.target.value
                  setPwnedWarning('')
                  debouncedCheckPwned(val)
                },
              })}
            />
            {passwordValue && (
              <span
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                }}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            )}
          </div>
          {touchedFields.password && errors.password && (
            <div style={{ color: 'red', fontSize: 12 }}>{errors.password.message}</div>
          )}
          {touchedFields.password && !errors.password && pwnedWarning && (
            <div style={{ color: 'red', fontSize: 12 }}>{pwnedWarning}</div>
          )}
          {checkingPwned && (
            <div style={{ color: '#888', fontSize: 12 }}>Checking password security...</div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password *"
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck={false}
              onPaste={(e) => e.preventDefault()}
              onInput={(e) => {
                blockHandler(e as React.FormEvent<HTMLInputElement>)
              }}
              {...rhfRegister('password_confirm', {
                required: 'Please fill in the required field.',
                validate: (val) => {
                  if (hasBlockedChars(val)) return 'Invalid character.'
                  return val === passwordValue || 'Password did not match.'
                },
              })}
            />
            {confirmPasswordValue && (
              <span
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                }}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            )}
          </div>
          {touchedFields.password_confirm && errors.password_confirm && (
            <div style={{ color: 'red', fontSize: 12 }}>{errors.password_confirm.message}</div>
          )}
        </div>

        {/* Privacy Policy & Terms */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={agreed}
            readOnly
            aria-checked={agreed}
            title={agreed ? 'Accepted' : 'Privacy Policy and Terms not yet accepted'}
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
            <span style={{ color: 'red' }}> *</span>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={!isValid || isSubmitting || !agreed}>
            {isSubmitting ? 'Signing up...' : 'Register'}
          </button>
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
            if (res.user && !res.user.is_agreed_privacy_policy) {
              setGooglePrivacyPending(true)
              setPolicyStep('privacy')
              setShowPolicyModal(true)
              return
            }
            navigate('/homepage')
          } else {
            toast.error('Google sign-in failed. Please try again.')
          }
        }}
        onError={() => toast.error('Google sign-in failed. Please try again.')}
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

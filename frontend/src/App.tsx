import React, { useEffect, useState, useRef } from 'react'
import {
  fetchTickets,
  createTicket,
  register,
  login,
  fetchTemplates,
  createTemplate,
  assignTicket,
  fetchTasks,
  escalateTicket,
  passTicket,
  getCurrentUser,
} from './api'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'


function base64UrlDecode(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  // pad
  while (str.length % 4) str += '='
  const bin = atob(str)
  try {
    return decodeURIComponent(escape(bin))
  } catch (e) {
    return bin
  }
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function parseUserFromJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = base64UrlDecode(parts[1])
    const obj = JSON.parse(payload)
    // some tokens use `user_id` instead of `id`
    const rawId = obj.id || obj.user_id || obj.sub || null
    const id = rawId ? Number(rawId) : null
    return { id, username: obj.username, email: obj.email || '', role: obj.role }
  } catch (e) {
    return null
  }
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  // set cookie for localhost domain; do not set Secure for localhost
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=localhost; SameSite=Lax`
}

function deleteCookie(name: string) {
  // expire the cookie on the same domain/path
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost; SameSite=Lax`
}

type LoginProps = {
  loginForm: { username: string; password: string }
  setLoginForm: (v: any) => void
  handleLogin: (e: React.FormEvent) => void
  loginErrors?: { username?: string; password?: string; general?: string }
  setLoginErrors?: (v: any) => void
}

export function LoginPage({ loginForm, setLoginForm, handleLogin, loginErrors, setLoginErrors }: LoginProps) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Login Page</h2>
      <p>Username or email address:</p>
      <form onSubmit={handleLogin} style={{ marginBottom: 20 }}>
        {loginErrors?.general ? <div style={{ color: 'red', marginBottom: 8 }}>{loginErrors.general}</div> : null}
        <div>
          <input name="username" type="text" autoComplete="username" value={loginForm.username} onChange={e => { setLoginForm(prev => ({ ...prev, username: e.target.value })); setLoginErrors && setLoginErrors((prev: any) => ({ ...prev, username: undefined, general: undefined })); }} />
          {loginErrors?.username ? <div style={{ color: 'red' }}>{loginErrors.username}</div> : null}
        </div>
        <p>Password:</p>
        <div>
          <input name="password" type="password" autoComplete="off" value={loginForm.password} onChange={e => { setLoginForm(prev => ({ ...prev, password: e.target.value })); setLoginErrors && setLoginErrors((prev: any) => ({ ...prev, password: undefined, general: undefined })); }} />
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

type RegisterProps = {
  form: { username: string; email: string; password: string; first_name?: string; last_name?: string; middle_name?: string; suffix?: string; phone?: string; password_confirm?: string; accept_terms?: boolean }
  setForm: (v: any) => void
  handleRegister: (e: React.FormEvent) => void
  registerErrors?: { [k: string]: string } | undefined
  openPolicy?: () => void
}

export function RegisterPage({ form, setForm, handleRegister, registerErrors, openPolicy }: RegisterProps) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Register (Client)</h2>
      <form onSubmit={handleRegister} noValidate>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <input name="first_name" placeholder="First name" value={form.first_name || ''} onChange={e => {
              const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
              setForm(prev => ({ ...prev, first_name: v }))
            }} />
            {registerErrors?.first_name && <div style={{ color: 'red' }}>{registerErrors.first_name}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <input name="middle_name" placeholder="Middle name" value={form.middle_name || ''} onChange={e => {
              const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
              setForm(prev => ({ ...prev, middle_name: v }))
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <input name="last_name" placeholder="Last name" value={form.last_name || ''} onChange={e => {
              const v = e.target.value.replace(/\b\w/g, (ch: string) => ch.toUpperCase())
              setForm(prev => ({ ...prev, last_name: v }))
            }} />
            {registerErrors?.last_name && <div style={{ color: 'red' }}>{registerErrors.last_name}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <select name="suffix" value={form.suffix || ''} onChange={e => setForm(prev => ({ ...prev, suffix: e.target.value }))}>
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
          <input name="username" type="text" placeholder="username" autoComplete="username" value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))} />
          {registerErrors?.username && <div style={{ color: 'red' }}>{registerErrors.username}</div>}

          {/* Username suggestions derived from first/middle/last name */}
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
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, username: s }))}
                      style={{ padding: '6px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#f8f8f8' }}
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
          <input name="email" type="email" placeholder="email" autoComplete="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
          {registerErrors?.email && <div style={{ color: 'red' }}>{registerErrors.email}</div>}
        </div>
        <div style={{ marginTop: 8 }}>
          <input name="phone" type="tel" placeholder="Phone number" value={form.phone || ''} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
          {registerErrors?.phone && <div style={{ color: 'red' }}>{registerErrors.phone}</div>}
        </div>
        <div style={{ marginTop: 8 }}>
          <input name="password" placeholder="password" type="password" autoComplete="new-password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} />
          {registerErrors?.password && <div style={{ color: 'red' }}>{registerErrors.password}</div>}
        </div>
        <div style={{ marginTop: 8 }}>
          <input name="password_confirm" placeholder="confirm password" type="password" autoComplete="new-password" value={form.password_confirm || ''} onChange={e => setForm(prev => ({ ...prev, password_confirm: e.target.value }))} />
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
            I agree to the <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => openPolicy && openPolicy('privacy')}>Privacy Policy</span> and <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => openPolicy && openPolicy('terms')}>Terms and Conditions</span>
          </div>
          {registerErrors?.accept_terms && <div style={{ color: 'red' }}>{registerErrors.accept_terms}</div>}
        </div>
        <div style={{ marginTop: 8 }}>
          <button>Register</button>
        </div>
      </form>
      <div style={{ marginTop: 8 }}>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  )
}

  type User = { id: number; username: string; email: string; role: string }

  export default function App() {
    const [user, setUser] = useState<User | null>(() => {
        const raw = getCookie('access')
        if (!raw) return null
        const parsed = parseUserFromJWT(raw)
        // if token payload doesn't include role, treat as unauthenticated
        if (!parsed || !parsed.role) return null
        return parsed
      })
    const [authChecked, setAuthChecked] = useState(false)

    const [tickets, setTickets] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', middle_name: '', suffix: '', phone: '', password_confirm: '', accept_terms: false })
    const [registerErrors, setRegisterErrors] = useState<{ [k: string]: string }>()
    const [showPolicyModal, setShowPolicyModal] = useState(false)
    const [policyStep, setPolicyStep] = useState<'privacy' | 'terms'>('privacy')
    const openPolicy = (step?: 'privacy' | 'terms') => {
      setPolicyStep(step || 'privacy')
      setShowPolicyModal(true)
    }
    const [loginForm, setLoginForm] = useState({ username: '', password: '' })
    const [loginErrors, setLoginErrors] = useState<{ username?: string; password?: string; general?: string }>({})

    useEffect(() => {
      if (user) loadAll()
    }, [user])

    // on mount, if there's an access cookie but no `user` state, fetch current user and redirect
    useEffect(() => {
      const tryRestore = async () => {
        if (!user) {
          const access = getCookie('access')
          if (access) {
            try {
              const current = await getCurrentUser()
              if (current && current.id) {
                setUser(current)
                navigate(roleRedirectPath(current))
              }
            } catch (e) {
              // ignore — user stays unauthenticated
            }
          }
        }
        setAuthChecked(true)
      }
      tryRestore()
      // run only on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function loadAll() {
      setTickets(await fetchTickets())
      setTemplates(await fetchTemplates())
      setTasks(await fetchTasks())
    }

    async function handleRegister(e: React.FormEvent) {
      e.preventDefault()
      setRegisterErrors(undefined)
      const first = (form.first_name || '').trim()
      const last = (form.last_name || '').trim()
      const username = (form.username || '').trim()
      const email = (form.email || '').trim()
      const phone = (form.phone || '').trim()
      const password = form.password || ''
      const confirm = form.password_confirm || ''
      const accept = !!form.accept_terms
      const errors: any = {}
      if (!first) errors.first_name = 'First name is required.'
      if (!last) errors.last_name = 'Last name is required.'
      if (!username) errors.username = 'Username is required.'
      if (!email) errors.email = 'Email is required.'
      // require Gmail address as in the reference validation
      const gmailRe = /^[a-z0-9._%+-]+@gmail\.com$/i
      if (email && !gmailRe.test(email)) errors.email = 'Email must be a valid Gmail address.'
      if (!phone) errors.phone = 'Phone number is required.'
      // basic phone validation: digits, 7-15 chars
      if (phone && !/^[0-9]{7,15}$/.test(phone)) errors.phone = 'Please enter a valid phone number.'

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

      const res = await register(form)
      if (res && (res.id || res.user || res.token)) {
        alert('Account successfully created')
        navigate('/login')
      } else {
        alert('Registration failed: ' + JSON.stringify(res))
      }
    }

    async function handleLogin(e: React.FormEvent) {
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
      // Support both single-token (res.token) and access/refresh pair (res.access / res.refresh)
      if (res.token || res.access) {
        const accessToken = res.access || res.token
        const refreshToken = res.refresh || null
        if (accessToken) setCookie('access', accessToken)
        if (refreshToken) setCookie('refresh', refreshToken)
        // fetch current user from backend when tokens are present
        try {
          const current = await (await import('./api')).getCurrentUser()
          setUser(current)
          navigate(roleRedirectPath(current))
        } catch (err) {
          // fallback: try to parse the token
          const parsed = accessToken ? parseUserFromJWT(accessToken) : res.user || null
          setUser(parsed)
          navigate(roleRedirectPath(parsed))
        }
      } else {
        alert('Invalid credentials.')
      }
    }

    function logout() {
      deleteCookie('access')
      deleteCookie('refresh')
      // removed user info cookie; nothing else to delete
      setUser(null)
      // clear auth form fields so they don't persist after logout
      setLoginForm({ username: '', password: '' })
      setForm({ username: '', email: '', password: '' })
    }

    async function handleCreate(e: React.FormEvent) {
      e.preventDefault()
      await createTicket({ title, description })
      setTitle('')
      setDescription('')
      setTickets(await fetchTickets())
    }

    async function handleCreateTemplate(e: React.FormEvent) {
      e.preventDefault()
      const name = (e.target as any).name.value
      const steps = (e.target as any).steps.value
      await createTemplate({ name, steps })
      setTemplates(await fetchTemplates())
    }

    async function handleAssign(ticketId: number) {
      const employee_id = parseInt(prompt('Employee id to assign') || '', 10)
      const template_id = parseInt(prompt('Template id (optional)') || '', 10) || undefined
      if (!employee_id) return alert('invalid')
      await assignTicket(ticketId, { employee_id, template_id })
      setTickets(await fetchTickets())
    }

    async function handleEscalate(ticketId: number) {
      await escalateTicket(ticketId)
      setTickets(await fetchTickets())
    }

    async function handlePass(ticketId: number) {
      const employee_id = parseInt(prompt('Employee id to pass to') || '', 10)
      if (!employee_id) return alert('invalid')
      await passTicket(ticketId, { employee_id })
      setTickets(await fetchTickets())
    }

    const navigate = useNavigate()

    function roleRedirectPath(u: User | null) {
      if (!u) return '/login'
      if (u.role === 'client') return '/homepage'
      if (u.role === 'employee') return '/employee/dashboard'
      if (u.role === 'admin') return '/admin/dashboard'
      return '/login'
    }

    function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
      if (!user) {
        const access = getCookie('access')
        // if there's an access cookie but auth restoration is still in progress, wait
        if (access && !authChecked) return null
        return <Navigate to="/login" replace />
      }
      if (role && user.role !== role) return <Navigate to={roleRedirectPath(user)} replace />
      return <>{children}</>
    }

    function Header() {
      const location = useLocation()
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
          <div>
            {location.pathname !== '/login' && location.pathname !== '/homepage' && location.pathname !== '/register' && location.pathname !== '/forgot-password' && !location.pathname.startsWith('/admin') && (
              <>
                <Link to="/">Home</Link>
                {' | '}
                <Link to="/login">Login</Link>
                {' | '}
                <Link to="/register">Register</Link>
              </>
            )}
            {location.pathname !== '/login' && user?.role === 'admin' && (
              <>
                {' '}
                <Link to="/admin/user-management">User Management</Link>
              </>
            )}
          </div>
            {/* Privacy/Terms only shown on the register form itself (checkbox below) */}
            {user && location.pathname !== '/login' ? (
              <>
                <strong>{user.username}</strong> ({user.role}) <button onClick={() => { logout(); navigate('/login') }}>Logout</button>
              </>
            ) : null}
        </div>
      )
    }

    

    function ClientHomepage() {
      return (
        <div style={{ padding: 20 }}>
          <h1>Client Homepage</h1>
          <section>
            <h3>Create Ticket</h3>
            <form onSubmit={handleCreate}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
              <button>Create</button>
            </form>
          </section>

          <section>
            <h3>Your Tickets</h3>
            <ul>
              {tickets.map(t => (
                <li key={t.id} style={{ marginBottom: 8 }}>
                  <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )
    }
    function EmployeeDashboard() {
      return (
        <div style={{ padding: 20 }}>
          <h1>Employee Dashboard</h1>
          <section>
            <h3>Your Tasks</h3>
            <ul>
              {tasks.map(task => (
                <li key={task.id}>
                  <strong>{task.ticket.title}</strong>: {task.description} — {task.status}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )
    }

    function AdminDashboard() {
      return (
        <div style={{ padding: 20 }}>
          <h1>Admin Dashboard</h1>
          <section>
            <h3>Templates</h3>
            <form onSubmit={handleCreateTemplate}>
              <input name="name" placeholder="Template name" required />
              <textarea name="steps" placeholder="One step per line" />
              <button>Create Template</button>
            </form>
          </section>

          <section>
            <h3>Tickets</h3>
            <ul>
              {tickets.map(t => (
                <li key={t.id} style={{ marginBottom: 8 }}>
                  <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
                  <div>By: {t.created_by?.username} — Assigned: {t.assigned_to?.username || '—'}</div>
                  <button onClick={() => handleAssign(t.id)}>Assign</button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )
    }

    function AdminUserManagement() {
      return (
        <div style={{ padding: 20 }}>
          <h1>User Management</h1>
          <p>Placeholder for user management UI.</p>
        </div>
      )
    }

    function ForgotPasswordPage() {
      const [email, setEmail] = useState('')
      const [message, setMessage] = useState<string | null>(null)
      const [loading, setLoading] = useState(false)

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        if (!email.trim()) return setMessage('Email is required.')
        setLoading(true)
        try {
          const res = await (await import('./api')).sendPasswordReset(email.trim())
          if (res && res.detail) {
            setMessage(res.detail || 'If an account exists, an email was sent.')
          } else if (res && res.success) {
            setMessage(res.message || 'If an account exists, an email was sent.')
          } else {
            setMessage('If an account exists, an email was sent.')
          }
        } catch (err) {
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
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" />
            <div style={{ marginTop: 8 }}>
              <button disabled={loading}>{loading ? 'Sending…' : 'Send reset email'}</button>
            </div>
          </form>
        </div>
      )
    }

    function ModalWrapper({ title, children }: { title: string; children: React.ReactNode }) {
      const navigateModal = useNavigate()
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', maxWidth: 900, maxHeight: '90vh', overflow: 'auto', padding: 24, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{title}</h2>
              <button onClick={() => navigateModal(-1)}>Close</button>
            </div>
            <div style={{ marginTop: 12 }}>{children}</div>
          </div>
        </div>
      )
    }

    // Privacy content is shown in a combined modal only on the register page; no standalone component

    function PrivacyTermsModal() {
      const [step, setStep] = useState<'privacy' | 'terms'>(policyStep)
      const [scrolledToBottom, setScrolledToBottom] = useState(false)
      const contentRef = useRef<HTMLDivElement | null>(null)

      useEffect(() => {
        setStep(policyStep)
      }, [policyStep])

      useEffect(() => {
        setScrolledToBottom(false)
        if (contentRef.current) contentRef.current.scrollTop = 0
      }, [step])

      const handleScroll = () => {
        const el = contentRef.current
        if (el) {
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5
          setScrolledToBottom(atBottom)
        }
      }

      const handleNext = () => {
        setStep('terms')
        setPolicyStep('terms')
      }
      const handleBack = () => {
        setStep('privacy')
        setPolicyStep('privacy')
        // after switching, scroll privacy content to bottom so Next is enabled
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight
            setScrolledToBottom(true)
          }
        }, 0)
      }

      const handleAgree = () => {
        if (step === 'privacy') {
          setStep('terms')
          setPolicyStep('terms')
          return
        }
        setForm(prev => ({ ...prev, accept_terms: true }))
        setShowPolicyModal(false)
      }

      const handleCancel = () => setShowPolicyModal(false)

      const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }
      const boxStyle: React.CSSProperties = { background: 'white', width: 'min(900px, 96%)', maxHeight: '90vh', overflow: 'hidden', padding: 24, borderRadius: 6 }
      const closeBtnStyle: React.CSSProperties = { position: 'absolute', top: 18, right: 20, background: 'transparent', border: 'none', fontSize: '1.6rem', color: '#888', cursor: 'pointer' }
      const contentBoxStyle: React.CSSProperties = { maxHeight: 350, overflowY: 'auto', paddingRight: 12 }
      const actionsStyle: React.CSSProperties = { marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }

      return (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <button aria-label="Close" style={closeBtnStyle} onClick={handleCancel}>&times;</button>
            <h2 style={{ marginTop: 0 }}>{step === 'privacy' ? 'Privacy Policy – Ticketing System' : 'Terms and Conditions – Ticketing System'}</h2>
            <div ref={contentRef} onScroll={handleScroll} style={contentBoxStyle}>
              {step === 'privacy' ? (
                <>
                  <p>
                    This Privacy Policy explains how the Ticketing System, operated under the standards of Maptech Information Solutions Inc., collects, uses, stores, and protects personal data of users who access and use the System.
                  </p>
                  <h3>1. Information We Collect</h3>
                  <p>We may collect the following categories of information:</p>
                  <ul>
                    <li><strong>Personal Information:</strong> Name, employee ID, email address, department, or other identifiers.</li>
                    <li><strong>Ticket Information:</strong> Content of submitted tickets, including issue descriptions, attachments, and timestamps.</li>
                    <li><strong>Usage Data:</strong> System logs such as login activity, device/browser details, and actions performed within the System.</li>
                  </ul>

                  <h3>2. How We Use Your Information</h3>
                  <p>Your data is used to:</p>
                  <ul>
                    <li>Process and respond to support requests.</li>
                    <li>Track and manage ticket status.</li>
                    <li>Generate internal reports to improve services.</li>
                    <li>Notify you about ticket progress or resolution.</li>
                    <li>Enhance user experience and system functionality.</li>
                  </ul>

                  <h3>3. Data Sharing and Disclosure</h3>
                  <p>We do not sell or share personal data externally. Data may be accessed by:</p>
                  <ul>
                    <li>Authorized support personnel (ticket agents, system administrators) for resolution purposes.</li>
                    <li>Internal management for reporting, audits, or compliance.</li>
                    <li>Legal authorities, when disclosure is required by law.</li>
                  </ul>

                  <h3>4. Data Retention</h3>
                  <p>Data is retained only as long as necessary to fulfill the purposes outlined or as required by organizational and regulatory policies.</p>

                  <h3>5. Your Rights</h3>
                  <p>You may:</p>
                  <ul>
                    <li>Access your personal data stored in the System.</li>
                    <li>Request correction of inaccurate or outdated information.</li>
                    <li>Request deletion of data, subject to retention requirements.</li>
                    <li>Withdraw consent, which may affect your ability to use the System.</li>
                  </ul>
                  <p>Requests should be directed to the Ticketing System administrators.</p>

                  <h3>6. Data Security</h3>
                  <p>We implement industry-standard technical and organizational safeguards, including authentication, access control, and continuous monitoring. While we strive for robust protection, no system is entirely immune to risk. Users are responsible for safeguarding their login credentials.</p>

                  <h3>7. Cookies and Tracking</h3>
                  <p>The System may use cookies or session-based tracking for authentication and analytics. You can manage cookie preferences through your browser.</p>

                  <h3>8. Policy Updates</h3>
                  <p>This Privacy Policy may be updated periodically. Significant changes will be communicated, and continued use of the System constitutes acceptance of the revised policy.</p>

                  <h3>9. Contact Us</h3>
                  <p>For questions or concerns, please contact the Ticketing System operators at sales@maptechisi.com or via the official Maptech channels.</p>
                </>
              ) : (
                <>
                  <p>By accessing and using the Ticketing System, you agree to comply with the following Terms and Conditions.</p>
                  <h3>1. Acceptance of Terms</h3>
                  <p>Use of the System indicates that you have read, understood, and agreed to these Terms. If you do not agree, you must refrain from using the System.</p>
                  <h3>2. Purpose</h3>
                  <p>The System is designed to help employees and authorized personnel submit, track, and resolve technical or administrative issues within the organization.</p>
                  <h3>3. User Responsibilities</h3>
                  <ul>
                    <li>Provide accurate and complete information when submitting tickets.</li>
                    <li>Use the System only for legitimate support requests.</li>
                    <li>Avoid duplicate, irrelevant, or fraudulent submissions.</li>
                    <li>Respond promptly to support team inquiries.</li>
                    <li>Maintain professionalism in all communications.</li>
                  </ul>
                  <h3>4. Ticket Closure</h3>
                  <p>Tickets are closed once marked resolved by the support team. Inactivity beyond SLA timelines may result in automatic closure. Lack of cooperation or feedback may delay resolution.</p>
                  <h3>5. Account and Security</h3>
                  <p>Users are responsible for keeping login credentials secure. Accounts must not be shared or misused. Unauthorized access or suspicious activity must be reported immediately.</p>
                  <h3>6. Prohibited Actions</h3>
                  <ul>
                    <li>Misuse or disrupt the System.</li>
                    <li>Upload harmful, offensive, or malicious content.</li>
                    <li>Attempt unauthorized access to restricted areas.</li>
                  </ul>
                  <h3>7. System Availability</h3>
                  <p>The System is provided on an “as-is” and “as-available” basis. While we strive for reliability, we do not guarantee uninterrupted or error-free operation. Scheduled maintenance or unforeseen issues may affect availability.</p>
                  <h3>8. Limitation of Liability</h3>
                  <p>To the fullest extent permitted by law, the organization and its affiliates are not liable for indirect, incidental, or consequential damages arising from use of the System.</p>
                  <h3>9. Changes to Terms</h3>
                  <p>These Terms may be updated periodically. Significant changes will be communicated.</p>
                  <h3>10. Governing Law</h3>
                  <p>These Terms are governed by the laws of the Philippines, without regard to conflict of law principles.</p>
                  <h3>11. Contact Information</h3>
                  <p>For inquiries, please contact the Ticketing System operators at sales@maptechisi.com.</p>
                </>
              )}
            </div>

            <div style={actionsStyle}>
              {step === 'privacy' ? (
                <button onClick={handleNext} disabled={!scrolledToBottom} style={{ padding: '8px 12px', opacity: scrolledToBottom ? 1 : 0.5 }}>Next</button>
              ) : (
                <>
                  <button onClick={handleBack} style={{ padding: '8px 12px' }}>Back</button>
                  <button onClick={handleAgree} disabled={!scrolledToBottom} style={{ padding: '8px 12px', opacity: scrolledToBottom ? 1 : 0.5 }}>I Agree</button>
                </>
              )}
              <button onClick={handleCancel} style={{ padding: '8px 12px' }}>Close</button>
            </div>
          </div>
        </div>
      )
    }
    

    return (
      <div>
        <Header />
        <Routes>
          <Route path="/" element={user ? <Navigate to={roleRedirectPath(user)} replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} loginErrors={loginErrors} setLoginErrors={setLoginErrors} />} />
          <Route path="/register" element={<RegisterPage form={form} setForm={setForm} handleRegister={handleRegister} registerErrors={registerErrors} openPolicy={openPolicy} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* Privacy/Terms modal handled inline on register page; no separate routes */}

          <Route
            path="/homepage"
            element={(
              <ProtectedRoute role="client">
                <ClientHomepage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/employee/dashboard"
            element={(
              <ProtectedRoute role="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/admin/user-management"
            element={(
              <ProtectedRoute role="admin">
                <AdminUserManagement />
              </ProtectedRoute>
            )}
          />

          <Route path="*" element={<div style={{ padding: 20 }}>Page not found. <Link to="/">Go home</Link></div>} />
        </Routes>
        {showPolicyModal && <PrivacyTermsModal />}
      </div>
    )
  }

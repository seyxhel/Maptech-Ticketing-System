import React, { useEffect, useState } from 'react'
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
} from './api'

type User = { id: number; username: string; email: string; role: string }

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  const [tickets, setTickets] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  useEffect(() => {
    if (user) loadAll()
  }, [user])

  async function loadAll() {
    setTickets(await fetchTickets())
    setTemplates(await fetchTemplates())
    setTasks(await fetchTasks())
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const res = await register(form)
    if (res.token) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setUser(res.user)
    } else {
      alert(JSON.stringify(res))
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await login(loginForm)
    if (res.token) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setUser(res.user)
    } else {
      alert('Login failed')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
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

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={{ marginBottom: 20 }}>
          <input placeholder="username" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input placeholder="password" type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button>Login</button>
        </form>

        <h2>Register (Client)</h2>
        <form onSubmit={handleRegister}>
          <input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <input placeholder="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button>Register</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Tickets — {user.username} ({user.role})</h1>
        <div>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {user.role === 'client' && (
        <section>
          <h3>Create Ticket</h3>
          <form onSubmit={handleCreate}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
            <button>Create</button>
          </form>
        </section>
      )}

      {user.role === 'admin' && (
        <section>
          <h3>Templates</h3>
          <form onSubmit={handleCreateTemplate}>
            <input name="name" placeholder="Template name" required />
            <textarea name="steps" placeholder="One step per line" />
            <button>Create Template</button>
          </form>
        </section>
      )}

      <section>
        <h3>Tickets</h3>
        <ul>
          {tickets.map(t => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
              <div>By: {t.created_by?.username} — Assigned: {t.assigned_to?.username || '—'}</div>
              {user.role === 'admin' && (
                <>
                  <button onClick={() => handleAssign(t.id)}>Assign</button>
                </>
              )}
              {user.role === 'employee' && t.assigned_to?.id === user.id && (
                <>
                  <button onClick={() => handleEscalate(t.id)}>Escalate</button>
                  <button onClick={() => handlePass(t.id)}>Pass</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      {user.role === 'employee' && (
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
      )}
    </div>
  )
}

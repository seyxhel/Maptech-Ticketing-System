import React, { useState, useEffect } from 'react'
import { fetchTickets, assignTicket } from '../../../services/ticketService'
import { fetchTemplates, createTemplate } from '../../../services/templateService'

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setTickets(await fetchTickets())
    setTemplates(await fetchTemplates())
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = (e.target as any).name.value
    const steps = (e.target as any).steps.value
    await createTemplate({ name, steps })
    setTemplates(await fetchTemplates())
  }

  const handleAssign = async (ticketId: number) => {
    const employee_id = parseInt(prompt('Employee id to assign') || '', 10)
    const template_id = parseInt(prompt('Template id (optional)') || '', 10) || undefined
    if (!employee_id) return alert('invalid')
    await assignTicket(ticketId, { employee_id, template_id })
    setTickets(await fetchTickets())
  }

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
          {tickets.map((t) => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
              <div>
                By: {t.created_by?.username} — Assigned: {t.assigned_to?.username || '—'}
              </div>
              <button onClick={() => handleAssign(t.id)}>Assign</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

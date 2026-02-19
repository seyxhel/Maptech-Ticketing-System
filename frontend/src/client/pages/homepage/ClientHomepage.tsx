import React, { useState, useEffect } from 'react'
import { fetchTickets, createTicket } from '../../../services/ticketService'

export default function ClientHomepage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setTickets(await fetchTickets())
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTicket({ title, description })
    setTitle('')
    setDescription('')
    await loadTickets()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Client Homepage</h1>
      <section>
        <h3>Create Ticket</h3>
        <form onSubmit={handleCreate}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <button>Create</button>
        </form>
      </section>

      <section>
        <h3>Your Tickets</h3>
        <ul>
          {tickets.map((t) => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

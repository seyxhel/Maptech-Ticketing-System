import React, { useEffect, useState } from 'react'
import { fetchTickets, createTicket, updateTicket } from './api'

type Ticket = {
  id: number
  title: string
  description: string
  status: string
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const data = await fetchTickets()
    setTickets(data)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createTicket({ title, description })
    setTitle('')
    setDescription('')
    load()
  }

  async function toggleStatus(t: Ticket) {
    const newStatus = t.status === 'open' ? 'closed' : 'open'
    await updateTicket(t.id, { status: newStatus })
    load()
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Simple Ticketing</h1>
      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
        <button type="submit">Create</button>
      </form>

      <ul>
        {tickets.map(t => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
            <button onClick={() => toggleStatus(t)} style={{ marginLeft: 8 }}>Toggle</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

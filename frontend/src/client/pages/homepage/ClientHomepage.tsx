import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTickets, createTicket } from '../../../services/ticketService'
import { getCurrentUser } from '../../../services/authService'

export default function ClientHomepage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [showPhoneWarning, setShowPhoneWarning] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadTickets()
    ;(async () => {
      try {
        const u = await getCurrentUser()
        setUserPhone(u.phone || '')
      } catch { /* ignore */ }
    })()
  }, [])

  const loadTickets = async () => {
    setTickets(await fetchTickets())
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    // Check if user has a phone number before allowing ticket creation
    if (!userPhone || !userPhone.trim()) {
      setShowPhoneWarning(true)
      return
    }
    await createTicket({ title, description })
    setTitle('')
    setDescription('')
    await loadTickets()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Client Homepage</h1>

      {/* Phone number warning modal */}
      {showPhoneWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              width: 400,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Phone Number Required</h3>
            <p style={{ color: '#555' }}>
              A phone number is required before you can create a ticket. This helps our team contact you about your request.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button
                onClick={() => setShowPhoneWarning(false)}
                style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPhoneWarning(false)
                  navigate('/settings')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}

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

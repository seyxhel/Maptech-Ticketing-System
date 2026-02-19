import { useState, useEffect } from 'react'
import { fetchTickets } from '../../services/ticketService'

export default function EmployeeDashboard() {
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setTickets(await fetchTickets())
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Employee Dashboard</h1>

      <section>
        <h3>Assigned Tickets</h3>
        {tickets.length === 0 ? (
          <p style={{ color: '#888' }}>No tickets assigned to you.</p>
        ) : (
          <ul>
            {tickets.map((t) => (
              <li key={t.id} style={{ marginBottom: 12 }}>
                <strong>{t.title}</strong> — {t.description} <em>({t.status})</em>
                <div style={{ fontSize: 13, color: '#555' }}>
                  Created by: {t.created_by?.username || '—'}
                </div>
                {t.tasks && t.tasks.length > 0 && (
                  <ul style={{ marginTop: 4 }}>
                    {t.tasks.map((task: any) => (
                      <li key={task.id}>
                        {task.description} — <em>{task.status}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { fetchTickets, assignTicket, reviewTicket } from '../../../services/ticketService'
import { fetchTemplates, createTemplate } from '../../../services/templateService'
import { fetchTypesOfService, createTypeOfService, updateTypeOfService, deleteTypeOfService, TypeOfService } from '../../../services/typeOfServiceService'
import { getCurrentUser } from '../../../services/authService'
import TicketChat from '../../../shared/components/TicketChat'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }
const badgeStyle = (color: string, bg: string): React.CSSProperties => ({ padding: '2px 10px', borderRadius: 9999, fontSize: 12, background: bg, color })

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [services, setServices] = useState<TypeOfService[]>([])
  const [activeTab, setActiveTab] = useState<'tickets' | 'services' | 'templates'>('tickets')

  // Service form
  const [svcName, setSvcName] = useState('')
  const [svcDesc, setSvcDesc] = useState('')
  const [editingSvc, setEditingSvc] = useState<TypeOfService | null>(null)

  // Ticket detail modal
  const [viewTicket, setViewTicket] = useState<any | null>(null)
  const [priority, setPriority] = useState('')
  const [currentUserId, setCurrentUserId] = useState<number>(0)

  useEffect(() => {
    loadAll()
    ;(async () => {
      try { const u = await getCurrentUser(); setCurrentUserId(u.id) } catch { /* ignore */ }
    })()
  }, [])

  const loadAll = async () => {
    setTickets(await fetchTickets())
    setTemplates(await fetchTemplates())
    setServices(await fetchTypesOfService())
  }

  // ---------- Templates ----------
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

  // ---------- Type of Service CRUD ----------
  const handleSvcSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSvc) {
      await updateTypeOfService(editingSvc.id, { name: svcName, description: svcDesc })
    } else {
      await createTypeOfService({ name: svcName, description: svcDesc })
    }
    setSvcName(''); setSvcDesc(''); setEditingSvc(null)
    setServices(await fetchTypesOfService())
  }

  const handleEditSvc = (s: TypeOfService) => { setEditingSvc(s); setSvcName(s.name); setSvcDesc(s.description) }
  const handleToggleSvc = async (s: TypeOfService) => { await updateTypeOfService(s.id, { is_active: !s.is_active }); setServices(await fetchTypesOfService()) }
  const handleDeleteSvc = async (s: TypeOfService) => { if (confirm(`Delete "${s.name}"?`)) { await deleteTypeOfService(s.id); setServices(await fetchTypesOfService()) } }

  // ---------- Ticket detail / review ----------
  const openTicketDetail = (t: any) => { setViewTicket(t); setPriority(t.priority || '') }
  const closeTicketDetail = () => { setViewTicket(null); setPriority('') }

  const handleReview = async () => {
    if (!viewTicket) return
    const updated = await reviewTicket(viewTicket.id, { priority })
    setViewTicket(updated)
    setTickets(await fetchTickets())
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
    background: 'none', fontWeight: active ? 700 : 400, color: active ? '#2563eb' : '#6b7280', fontSize: 14,
  })

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        <button style={tabStyle(activeTab === 'tickets')} onClick={() => setActiveTab('tickets')}>Tickets</button>
        <button style={tabStyle(activeTab === 'services')} onClick={() => setActiveTab('services')}>Type of Service</button>
        <button style={tabStyle(activeTab === 'templates')} onClick={() => setActiveTab('templates')}>Templates</button>
      </div>

      {/* ───── TICKETS TAB ───── */}
      {activeTab === 'tickets' && (
        <section>
          <h3 style={{ marginTop: 0 }}>Tickets</h3>
          {tickets.length === 0 ? <p style={{ color: '#888' }}>No tickets.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['STF No.', 'Date', 'Title', 'Client', 'Status', 'Priority', 'Assigned', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontFamily: 'monospace' }}>{t.stf_no}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.date}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.title}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.client || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <span style={badgeStyle(
                        t.status === 'open' ? '#1d4ed8' : t.status === 'closed' ? '#15803d' : '#92400e',
                        t.status === 'open' ? '#dbeafe' : t.status === 'closed' ? '#dcfce7' : '#fef3c7',
                      )}>{t.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.priority || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.assigned_to?.username || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...btnPrimary, padding: '5px 12px', fontSize: 12 }} onClick={() => openTicketDetail(t)}>View</button>
                        <button style={{ ...btnSecondary, padding: '5px 12px', fontSize: 12 }} onClick={() => handleAssign(t.id)}>Assign</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* ───── TYPE OF SERVICE TAB ───── */}
      {activeTab === 'services' && (
        <section>
          <h3 style={{ marginTop: 0 }}>Type of Service</h3>
          <form onSubmit={handleSvcSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Service Name *</label>
              <input style={{ ...inputStyle, width: 220 }} value={svcName} onChange={(e) => setSvcName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Description</label>
              <input style={{ ...inputStyle, width: 300 }} value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
            </div>
            <button type="submit" style={btnPrimary}>{editingSvc ? 'Update' : 'Add'}</button>
            {editingSvc && <button type="button" style={btnSecondary} onClick={() => { setEditingSvc(null); setSvcName(''); setSvcDesc('') }}>Cancel</button>}
          </form>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                {['Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{s.name}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{s.description || '—'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={badgeStyle(s.is_active ? '#15803d' : '#dc2626', s.is_active ? '#dcfce7' : '#fee2e2')}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...btnSecondary, padding: '4px 10px', fontSize: 12 }} onClick={() => handleEditSvc(s)}>Edit</button>
                      <button style={{ ...btnSecondary, padding: '4px 10px', fontSize: 12 }} onClick={() => handleToggleSvc(s)}>{s.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }} onClick={() => handleDeleteSvc(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={4} style={{ padding: 16, color: '#888', textAlign: 'center' }}>No services yet.</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      {/* ───── TEMPLATES TAB ───── */}
      {activeTab === 'templates' && (
        <section>
          <h3 style={{ marginTop: 0 }}>Templates</h3>
          <form onSubmit={handleCreateTemplate} style={{ marginBottom: 16 }}>
            <input name="name" placeholder="Template name" required style={{ ...inputStyle, width: 250, marginRight: 8, display: 'inline-block' }} />
            <textarea name="steps" placeholder="One step per line" style={{ ...inputStyle, width: 350, verticalAlign: 'top', display: 'inline-block' }} />
            <button style={{ ...btnPrimary, marginLeft: 8 }}>Create Template</button>
          </form>
          <ul>
            {templates.map((t: any) => (
              <li key={t.id} style={{ marginBottom: 8 }}><strong>{t.name}</strong> — {t.steps?.split('\n').length || 0} steps</li>
            ))}
          </ul>
        </section>
      )}

      {/* ───── TICKET DETAIL MODAL ───── */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 620, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Ticket Details</h2>
              <button onClick={closeTicketDetail} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 14 }}>
              <div><strong>STF No.:</strong> <span style={{ fontFamily: 'monospace' }}>{viewTicket.stf_no}</span></div>
              <div><strong>Date:</strong> {viewTicket.date}</div>
              <div><strong>Time In:</strong> {viewTicket.time_in ? new Date(viewTicket.time_in).toLocaleString() : <em style={{ color: '#9ca3af' }}>Not yet reviewed</em>}</div>
              <div><strong>Time Out:</strong> {viewTicket.time_out ? new Date(viewTicket.time_out).toLocaleString() : '—'}</div>
              <div><strong>Status:</strong> {viewTicket.status}</div>
              <div><strong>Created By:</strong> {viewTicket.created_by?.username}</div>
              <div><strong>Client:</strong> {viewTicket.client || '—'}</div>
              <div><strong>Contact Person:</strong> {viewTicket.contact_person || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {viewTicket.address || '—'}</div>
              <div><strong>Designation:</strong> {viewTicket.designation || '—'}</div>
              <div><strong>Landline:</strong> {viewTicket.landline || '—'}</div>
              <div><strong>Department/Org:</strong> {viewTicket.department_organization || '—'}</div>
              <div><strong>Mobile No.:</strong> {viewTicket.mobile_no || '—'}</div>
              <div><strong>Email:</strong> {viewTicket.email_address || '—'}</div>
              <div><strong>Type of Service:</strong> {viewTicket.type_of_service_detail?.name || viewTicket.type_of_service_others || '—'}</div>
              <div><strong>Assigned To:</strong> {viewTicket.assigned_to?.username || '—'}</div>
            </div>

            {/* Priority selector */}
            <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'block' }}>Priority Level</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'low', label: 'Low', color: '#15803d', bg: '#dcfce7' },
                  { value: 'medium', label: 'Medium', color: '#ca8a04', bg: '#fef9c3' },
                  { value: 'high', label: 'High', color: '#ea580c', bg: '#ffedd5' },
                  { value: 'critical', label: 'Critical', color: '#dc2626', bg: '#fee2e2' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    style={{
                      padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      border: priority === p.value ? `2px solid ${p.color}` : '2px solid transparent',
                      background: p.bg, color: p.color,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={closeTicketDetail}>Close</button>
              <button style={btnPrimary} onClick={handleReview}>
                {viewTicket.time_in ? 'Update Priority' : 'Review & Start Time In'}
              </button>
            </div>

            {/* ── Admin ↔ Employee Chat ── */}
            {viewTicket.assigned_to && currentUserId > 0 && (
              <div style={{ marginTop: 20 }}>
                <label style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'block' }}>Admin ↔ Employee Chat</label>
                <div style={{ height: 320 }}>
                  <TicketChat ticketId={viewTicket.id} channelType="admin_employee" currentUserId={currentUserId} currentUserRole="admin" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

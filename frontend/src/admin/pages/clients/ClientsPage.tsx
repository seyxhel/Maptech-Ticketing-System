import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchClients, createClient, updateClient, deleteClient, fetchClientTickets, Client } from '../../../services/clientService'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#374151' }
const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#3BC25B', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }
const btnDanger: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }

const statusBadge = (s: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    open: { bg: '#dbeafe', color: '#1d4ed8' },
    in_progress: { bg: '#e0e7ff', color: '#4338ca' },
    closed: { bg: '#dcfce7', color: '#15803d' },
    escalated: { bg: '#fef3c7', color: '#92400e' },
    escalated_external: { bg: '#fee2e2', color: '#dc2626' },
    pending_closure: { bg: '#f3e8ff', color: '#7c3aed' },
  }
  const m = map[s] || { bg: '#f3f4f6', color: '#374151' }
  return { padding: '2px 10px', borderRadius: 9999, fontSize: 12, background: m.bg, color: m.color }
}

const emptyClient = (): Partial<Client> => ({
  client_name: '', contact_person: '', landline: '', mobile_no: '',
  designation: '', department_organization: '', email_address: '', address: '',
})

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>(emptyClient())

  // Records view
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [clientTickets, setClientTickets] = useState<any[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    try { setClients(await fetchClients(search || undefined)) } catch { toast.error('Failed to load clients') }
  }

  const handleSearch = () => load()

  const openCreate = () => { setEditing(null); setForm(emptyClient()); setShowForm(true) }
  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({
      client_name: c.client_name, contact_person: c.contact_person,
      landline: c.landline, mobile_no: c.mobile_no,
      designation: c.designation, department_organization: c.department_organization,
      email_address: c.email_address, address: c.address,
    })
    setShowForm(true)
  }

  const handleViewRecords = async (c: Client) => {
    setViewClient(c)
    try { setClientTickets(await fetchClientTickets(c.id)) } catch { setClientTickets([]) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_name?.trim()) { toast.error('Client name is required'); return }
    try {
      if (editing) {
        await updateClient(editing.id, form)
        toast.success('Client updated')
      } else {
        await createClient(form)
        toast.success('Client created')
      }
      setShowForm(false)
      load()
    } catch { toast.error('Failed to save client') }
  }

  const handleDelete = async (c: Client) => {
    if (!confirm(`Delete client "${c.client_name}"?`)) return
    try { await deleteClient(c.id); toast.success('Client deleted'); load() } catch { toast.error('Failed to delete') }
  }

  const setField = (name: string, value: any) => setForm(prev => ({ ...prev, [name]: value }))

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Clients</h1>
        <button style={btnPrimary} onClick={openCreate}>+ Add Client</button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input style={{ ...inputStyle, maxWidth: 300 }} placeholder="Search clients..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button style={btnSecondary} onClick={handleSearch}>Search</button>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {clients.length === 0 ? <p style={{ color: '#888' }}>No clients found.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Client', 'Contact Person', 'Mobile', 'Email', 'Dept/Org', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600 }}>{c.client_name}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{c.contact_person || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{c.mobile_no || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{c.email_address || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{c.department_organization || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...btnPrimary, padding: '4px 10px', fontSize: 12 }} onClick={() => handleViewRecords(c)}>Records</button>
                        <button style={{ ...btnSecondary, padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(c)}>Edit</button>
                        <button style={{ ...btnDanger, padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Client Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={inputStyle} value={form.client_name || ''} onChange={e => setField('client_name', e.target.value)} placeholder="e.g. Maptech Inc." />
                </div>
                <div>
                  <label style={labelStyle}>Contact Person</label>
                  <input style={inputStyle} value={form.contact_person || ''} onChange={e => setField('contact_person', e.target.value)} placeholder="e.g. Juan Dela Cruz" />
                </div>
                <div>
                  <label style={labelStyle}>Designation</label>
                  <input style={inputStyle} value={form.designation || ''} onChange={e => setField('designation', e.target.value)} placeholder="e.g. IT Manager" />
                </div>
                <div>
                  <label style={labelStyle}>Landline No.</label>
                  <input style={inputStyle} value={form.landline || ''} onChange={e => setField('landline', e.target.value)} placeholder="e.g. (02) 1234-5678" />
                </div>
                <div>
                  <label style={labelStyle}>Mobile No.</label>
                  <input style={inputStyle} value={form.mobile_no || ''} onChange={e => setField('mobile_no', e.target.value)} placeholder="e.g. 09171234567" />
                </div>
                <div>
                  <label style={labelStyle}>Department/Organization</label>
                  <input style={inputStyle} value={form.department_organization || ''} onChange={e => setField('department_organization', e.target.value)} placeholder="e.g. Information Technology" />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" style={inputStyle} value={form.email_address || ''} onChange={e => setField('email_address', e.target.value)} placeholder="e.g. email@company.com" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Address</label>
                  <textarea rows={2} style={{ ...inputStyle, resize: 'none' as const }} value={form.address || ''} onChange={e => setField('address', e.target.value)} placeholder="Full address..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="submit" style={btnPrimary}>{editing ? 'Update' : 'Create'} Client</button>
                <button type="button" style={btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Records (Tickets) Modal */}
      {viewClient && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: 900, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Records: {viewClient.client_name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  {viewClient.contact_person} | {viewClient.mobile_no} | {viewClient.email_address}
                </p>
              </div>
              <button onClick={() => setViewClient(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>

            {/* Client Info Card */}
            <div style={{ ...cardStyle, borderLeft: '4px solid #3BC25B', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><strong>Landline:</strong> {viewClient.landline || '—'}</div>
                <div><strong>Designation:</strong> {viewClient.designation || '—'}</div>
                <div><strong>Dept/Org:</strong> {viewClient.department_organization || '—'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {viewClient.address || '—'}</div>
              </div>
            </div>

            {/* Tickets Table */}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Service Ticket Records ({clientTickets.length})</h3>
            {clientTickets.length === 0 ? <p style={{ color: '#888' }}>No tickets found for this client.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                    {['STF No.', 'Date', 'Type of Service', 'Priority', 'Status', 'Assigned To', 'Progress'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientTickets.map((t: any) => (
                    <tr key={t.id}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12, fontFamily: 'monospace' }}>{t.stf_no}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{t.date}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{t.type_of_service_detail?.name || t.type_of_service_others || '—'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{t.priority || '—'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                        <span style={statusBadge(t.status)}>{t.status?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{t.assigned_to?.username || '—'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                        {t.progress_percentage != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(t.progress_percentage, 100)}%`, height: '100%', background: t.progress_percentage >= 80 ? '#ef4444' : t.progress_percentage >= 50 ? '#eab308' : '#3BC25B', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>{t.progress_percentage}%</span>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { fetchTickets, assignTicket, reviewTicket, confirmTicket, closeTicket, escalateExternal, fetchEmployees, fetchCSAT } from '../../../services/ticketService'
import { fetchTemplates, createTemplate } from '../../../services/templateService'
import { fetchTypesOfService, createTypeOfService, updateTypeOfService, deleteTypeOfService, TypeOfService } from '../../../services/typeOfServiceService'
import { getCurrentUser } from '../../../services/authService'
import TicketChat from '../../../shared/components/TicketChat'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }
const btnDanger: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }

const statusBadge = (s: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    open: { bg: '#dbeafe', color: '#1d4ed8' },
    in_progress: { bg: '#e0e7ff', color: '#4338ca' },
    closed: { bg: '#dcfce7', color: '#15803d' },
    escalated: { bg: '#fef3c7', color: '#92400e' },
    escalated_external: { bg: '#fee2e2', color: '#dc2626' },
    pending_closure: { bg: '#f3e8ff', color: '#7c3aed' },
    pending_feedback: { bg: '#fef9c3', color: '#a16207' },
  }
  const m = map[s] || { bg: '#f3f4f6', color: '#374151' }
  return { padding: '2px 10px', borderRadius: 9999, fontSize: 12, background: m.bg, color: m.color }
}

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

  // Employees list for assign
  const [employees, setEmployees] = useState<any[]>([])

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignTicketId, setAssignTicketId] = useState<number | null>(null)
  const [assignEmployeeId, setAssignEmployeeId] = useState('')
  const [assignTemplateId, setAssignTemplateId] = useState('')

  // External escalation modal
  const [showExtEscModal, setShowExtEscModal] = useState(false)
  const [extEscTo, setExtEscTo] = useState('')
  const [extEscNotes, setExtEscNotes] = useState('')

  // CSAT survey for detail
  const [csatData, setCsatData] = useState<any | null>(null)

  // Media preview lightbox
  const [previewMedia, setPreviewMedia] = useState<{ url: string; isVideo: boolean } | null>(null)

  useEffect(() => {
    loadAll()
    ;(async () => {
      try { const u = await getCurrentUser(); setCurrentUserId(u.id) } catch { /* ignore */ }
      try { setEmployees(await fetchEmployees()) } catch { /* ignore */ }
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
    setAssignTicketId(ticketId)
    setAssignEmployeeId('')
    setAssignTemplateId('')
    setShowAssignModal(true)
  }

  const confirmAssign = async () => {
    if (!assignTicketId || !assignEmployeeId) return
    await assignTicket(assignTicketId, {
      employee_id: Number(assignEmployeeId),
      template_id: assignTemplateId ? Number(assignTemplateId) : undefined,
    })
    setShowAssignModal(false)
    setTickets(await fetchTickets())
  }

  const handleConfirm = async () => {
    if (!viewTicket) return
    await confirmTicket(viewTicket.id)
    const refreshed = await fetchTickets()
    setTickets(refreshed)
    setViewTicket(refreshed.find((t: any) => t.id === viewTicket.id) || viewTicket)
  }

  const handleCloseTicket = async () => {
    if (!viewTicket) return
    const result = await closeTicket(viewTicket.id)
    if (result.ok) {
      const refreshed = await fetchTickets()
      setTickets(refreshed)
      setViewTicket(refreshed.find((t: any) => t.id === viewTicket.id) || null)
    } else {
      alert(result.data?.detail || 'Cannot close ticket — check that resolution proof and CSAT survey are present.')
    }
  }

  const handleExtEscalate = async () => {
    if (!viewTicket || !extEscTo.trim()) return
    await escalateExternal(viewTicket.id, { escalated_to: extEscTo, notes: extEscNotes })
    setShowExtEscModal(false)
    setExtEscTo(''); setExtEscNotes('')
    const refreshed = await fetchTickets()
    setTickets(refreshed)
    setViewTicket(refreshed.find((t: any) => t.id === viewTicket.id) || viewTicket)
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
  const openTicketDetail = async (t: any) => {
    setViewTicket(t)
    setPriority(t.priority || '')
    setCsatData(null)
    try { const c = await fetchCSAT(t.id); setCsatData(c) } catch { /* no survey yet */ }
  }
  const closeTicketDetail = () => { setViewTicket(null); setPriority(''); setCsatData(null) }

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
                  {['STF No.', 'Date', 'Client', 'Status', 'Priority', 'Assigned', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontFamily: 'monospace' }}>{t.stf_no}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.date}</td>

                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.client || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <span style={statusBadge(t.status)}>{t.status?.replace(/_/g, ' ')}</span>
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
                    <span style={{ padding: '2px 10px', borderRadius: 9999, fontSize: 12, background: s.is_active ? '#dcfce7' : '#fee2e2', color: s.is_active ? '#15803d' : '#dc2626' }}>
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
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 750, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Ticket Details — {viewTicket.stf_no}</h2>
              <button onClick={closeTicketDetail} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 14, padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 16 }}>
              <div><strong>STF No.:</strong> <span style={{ fontFamily: 'monospace' }}>{viewTicket.stf_no}</span></div>
              <div><strong>Date:</strong> {viewTicket.date}</div>
              <div><strong>Time In:</strong> {viewTicket.time_in ? new Date(viewTicket.time_in).toLocaleString() : <em style={{ color: '#9ca3af' }}>Not yet reviewed</em>}</div>
              <div><strong>Time Out:</strong> {viewTicket.time_out ? new Date(viewTicket.time_out).toLocaleString() : '—'}</div>
              <div><strong>Status:</strong> <span style={statusBadge(viewTicket.status)}>{viewTicket.status?.replace(/_/g, ' ')}</span></div>
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
              <div><strong>Preferred Support:</strong> {viewTicket.preferred_support_type?.replace(/_/g, ' ') || '—'}</div>
              <div><strong>Confirmed:</strong> {viewTicket.confirmed_by_admin ? '✅ Yes' : '⏳ Pending'}</div>
              {viewTicket.description_of_problem && <div style={{ gridColumn: '1 / -1' }}><strong>Problem Description:</strong> {viewTicket.description_of_problem}</div>}
            </div>

            {/* Employee work details (if filled) */}
            {(viewTicket.action_taken || viewTicket.remarks || viewTicket.job_status) && (
              <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Employee Progress</h4>
                {viewTicket.action_taken && <div style={{ marginBottom: 4 }}><strong>Action Taken:</strong> {viewTicket.action_taken}</div>}
                {viewTicket.remarks && <div style={{ marginBottom: 4 }}><strong>Remarks:</strong> {viewTicket.remarks}</div>}
                {viewTicket.job_status && <div><strong>Job Status:</strong> {viewTicket.job_status?.replace(/_/g, ' ')}</div>}
              </div>
            )}

            {/* External escalation info */}
            {viewTicket.status === 'escalated_external' && (
              <div style={{ padding: 16, background: '#fee2e2', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#dc2626' }}>Externally Escalated</h4>
                <div><strong>To:</strong> {viewTicket.external_escalated_to || '—'}</div>
                {viewTicket.external_escalation_notes && <div><strong>Notes:</strong> {viewTicket.external_escalation_notes}</div>}
                {viewTicket.external_escalated_at && <div><strong>Date:</strong> {new Date(viewTicket.external_escalated_at).toLocaleString()}</div>}
              </div>
            )}

            {/* Escalation Logs */}
            {viewTicket.escalation_logs && viewTicket.escalation_logs.length > 0 && (
              <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Escalation History</h4>
                {viewTicket.escalation_logs.map((log: any, i: number) => (
                  <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: i < viewTicket.escalation_logs.length - 1 ? '1px solid #fde68a' : 'none' }}>
                    <span style={{ color: '#92400e', fontWeight: 600 }}>{log.escalation_type}</span>
                    {log.from_user_name && <span> from <strong>{log.from_user_name}</strong></span>}
                    {log.to_user_name && <span> → <strong>{log.to_user_name}</strong></span>}
                    {log.to_external && <span> → <strong>{log.to_external}</strong></span>}
                    {log.notes && <span style={{ color: '#6b7280' }}> — {log.notes}</span>}
                    <span style={{ color: '#9ca3af', marginLeft: 8 }}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CSAT Survey */}
            {csatData && (
              <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#15803d' }}>CSAT Survey Result</h4>
                <div><strong>Rating:</strong> {'⭐'.repeat(csatData.rating)} ({csatData.rating}/5)</div>
                {csatData.comments && <div style={{ marginTop: 4 }}><strong>Comments:</strong> {csatData.comments}</div>}
                {csatData.has_other_concerns && <div style={{ marginTop: 4 }}><strong>Other Concerns:</strong> {csatData.other_concerns_text}</div>}
              </div>
            )}

            {/* Attachments */}
            {viewTicket.attachments && viewTicket.attachments.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'block' }}>Attachments</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {viewTicket.attachments.map((att: any) => {
                    const isImage = att.file && att.file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    const isVideo = att.file && att.file.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                    return (
                      <div key={att.id} style={{ position: 'relative', width: 80, height: 80, borderRadius: 6, overflow: 'hidden', border: att.is_resolution_proof ? '2px solid #16a34a' : '1px solid #e5e7eb', cursor: (isImage || isVideo) ? 'pointer' : 'default' }} onClick={() => { if (isImage || isVideo) setPreviewMedia({ url: att.file, isVideo: !!isVideo }) }}>
                        {isImage ? <img src={att.file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : isVideo ? <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 11, color: '#6b7280' }}><span style={{ fontSize: 24, marginBottom: 2 }}>&#9654;</span>Video</div> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 11, color: '#6b7280' }}>File</div>}
                        {att.is_resolution_proof && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#16a34a', color: '#fff', fontSize: 9, textAlign: 'center', padding: 1 }}>PROOF</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Priority selector */}
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 16 }}>
              <label style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'block' }}>Priority Level</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'low', label: 'Low', color: '#15803d', bg: '#dcfce7' },
                  { value: 'medium', label: 'Medium', color: '#ca8a04', bg: '#fef9c3' },
                  { value: 'high', label: 'High', color: '#ea580c', bg: '#ffedd5' },
                  { value: 'critical', label: 'Critical', color: '#dc2626', bg: '#fee2e2' },
                ].map((p) => (
                  <button key={p.value} type="button" onClick={() => setPriority(p.value)} style={{ padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: priority === p.value ? `2px solid ${p.color}` : '2px solid transparent', background: p.bg, color: p.color }}>{p.label}</button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <button style={btnPrimary} onClick={handleReview}>{viewTicket.time_in ? 'Update Priority' : 'Review & Start Time In'}</button>
              {!viewTicket.confirmed_by_admin && viewTicket.status !== 'closed' && (
                <button style={{ ...btnPrimary, background: '#059669' }} onClick={handleConfirm}>Confirm Issue</button>
              )}
              {viewTicket.status !== 'closed' && viewTicket.status !== 'escalated_external' && (
                <button style={{ ...btnDanger, background: '#7c3aed' }} onClick={() => { setExtEscTo(''); setExtEscNotes(''); setShowExtEscModal(true) }}>Escalate External</button>
              )}
              {['pending_closure'].includes(viewTicket.status) && (
                <button style={{ ...btnPrimary, background: '#15803d' }} onClick={handleCloseTicket}>Close Ticket</button>
              )}
              <button style={btnSecondary} onClick={closeTicketDetail}>Close</button>
            </div>

            {/* Admin ↔ Employee Chat */}
            {viewTicket.assigned_to && currentUserId > 0 && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'block' }}>Admin ↔ Employee Chat</label>
                <div style={{ height: 320 }}>
                  <TicketChat ticketId={viewTicket.id} channelType="admin_employee" currentUserId={currentUserId} currentUserRole="admin" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Assign Modal ── */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0 }}>Assign Ticket</h3>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Employee *</label>
            <select style={inputStyle} value={assignEmployeeId} onChange={(e) => setAssignEmployeeId(e.target.value)} required>
              <option value="">-- Select Employee --</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.username})</option>
              ))}
            </select>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, marginTop: 12 }}>Template <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <select style={inputStyle} value={assignTemplateId} onChange={(e) => setAssignTemplateId(e.target.value)}>
              <option value="">-- No Template --</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={btnSecondary} onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button style={btnPrimary} disabled={!assignEmployeeId} onClick={confirmAssign}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* ── External Escalation Modal ── */}
      {showExtEscModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#7c3aed' }}>Escalate to External</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Escalate this ticket to a distributor or principal.</p>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Escalated To *</label>
            <input style={inputStyle} value={extEscTo} onChange={(e) => setExtEscTo(e.target.value)} placeholder="e.g. Dell Philippines, HP Support" />
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, marginTop: 12 }}>Notes <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={extEscNotes} onChange={(e) => setExtEscNotes(e.target.value)} placeholder="Details about the escalation..." />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={btnSecondary} onClick={() => setShowExtEscModal(false)}>Cancel</button>
              <button style={{ ...btnDanger, background: '#7c3aed' }} disabled={!extEscTo.trim()} onClick={handleExtEscalate}>Escalate</button>
            </div>
          </div>
        </div>
      )}
      {/* ───── MEDIA PREVIEW LIGHTBOX ───── */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, cursor: 'pointer',
          }}
        >
          <button
            onClick={() => setPreviewMedia(null)}
            style={{
              position: 'absolute', top: 16, right: 24,
              background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', zIndex: 2001,
            }}
          >&times;</button>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
            {previewMedia.isVideo ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8 }}
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Attachment preview"
                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

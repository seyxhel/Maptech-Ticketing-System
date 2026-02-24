import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTickets, createTicket, submitCSAT } from '../../../services/ticketService'
import { fetchTypesOfService, TypeOfService } from '../../../services/typeOfServiceService'
import { getCurrentUser } from '../../../services/authService'
import TicketChat from '../../../shared/components/TicketChat'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#374151' }

export default function ClientHomepage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [showPhoneWarning, setShowPhoneWarning] = useState(false)
  const [typesOfService, setTypesOfService] = useState<TypeOfService[]>([])
  const [viewTicket, setViewTicket] = useState<any | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number>(0)
  const navigate = useNavigate()

  // Form fields
  const [client, setClient] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [address, setAddress] = useState('')
  const [designation, setDesignation] = useState('')
  const [landline, setLandline] = useState('')
  const [deptOrg, setDeptOrg] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [typeOfServiceId, setTypeOfServiceId] = useState<string>('')
  const [typeOfServiceOthers, setTypeOfServiceOthers] = useState('')
  const [preferredSupport, setPreferredSupport] = useState('')
  const [descProblem, setDescProblem] = useState('')

  // CSAT survey state
  const [csatTicket, setCsatTicket] = useState<any | null>(null)
  const [csatRating, setCsatRating] = useState(0)
  const [csatComments, setCsatComments] = useState('')
  const [hasOtherConcerns, setHasOtherConcerns] = useState(false)
  const [otherConcernsText, setOtherConcernsText] = useState('')
  const [csatSubmitting, setCsatSubmitting] = useState(false)

  useEffect(() => {
    loadTickets()
    loadServices()
    ;(async () => {
      try {
        const u = await getCurrentUser()
        setUserPhone(u.phone || '')
        setCurrentUserId(u.id)
      } catch { /* ignore */ }
    })()
  }, [])

  const loadTickets = async () => { setTickets(await fetchTickets()) }
  const loadServices = async () => { setTypesOfService(await fetchTypesOfService()) }

  const resetForm = () => {
    setClient(''); setContactPerson(''); setAddress('')
    setDesignation(''); setLandline(''); setDeptOrg(''); setMobileNo('')
    setEmailAddress(''); setTypeOfServiceId(''); setTypeOfServiceOthers('')
    setPreferredSupport(''); setDescProblem('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userPhone || !userPhone.trim()) { setShowPhoneWarning(true); return }
    const payload: Record<string, any> = {
      client,
      contact_person: contactPerson,
      address,
      designation,
      landline,
      department_organization: deptOrg,
      mobile_no: mobileNo,
      email_address: emailAddress,
    }
    if (typeOfServiceId === 'others') {
      payload.type_of_service_others = typeOfServiceOthers
    } else if (typeOfServiceId) {
      payload.type_of_service = Number(typeOfServiceId)
    }
    if (preferredSupport) payload.preferred_support_type = preferredSupport
    if (descProblem) payload.description_of_problem = descProblem
    await createTicket(payload)
    resetForm()
    await loadTickets()
  }

  // Landline: allow digits, parentheses, dashes, spaces
  const handleLandlineChange = (val: string) => {
    if (/^[0-9() -]*$/.test(val)) setLandline(val)
  }

  // Mobile: digits only, max 11
  const handleMobileChange = (val: string) => {
    if (/^\d*$/.test(val) && val.length <= 11) setMobileNo(val)
  }

  const selectedOthers = typeOfServiceId === 'others'

  const supportTypes = [
    { value: 'remote_online', label: 'Remote/Online' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'chat', label: 'Chat' },
    { value: 'call', label: 'Call' },
  ]

  const statusBadge = (s: string) => {
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
    return { padding: '2px 8px', borderRadius: 9999, fontSize: 12, background: m.bg, color: m.color }
  }

  const handleOpenCSAT = (t: any) => {
    setCsatTicket(t)
    setCsatRating(0)
    setCsatComments('')
    setHasOtherConcerns(false)
    setOtherConcernsText('')
  }

  const handleSubmitCSAT = async () => {
    if (!csatTicket || csatRating === 0) return
    setCsatSubmitting(true)
    const result = await submitCSAT({
      ticket: csatTicket.id,
      rating: csatRating,
      comments: csatComments,
      has_other_concerns: hasOtherConcerns,
      other_concerns_text: otherConcernsText,
    })
    setCsatSubmitting(false)
    if (result.ok) {
      setCsatTicket(null)
      await loadTickets()
    } else {
      alert(result.data?.detail || 'Failed to submit survey')
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Client Homepage</h1>

      {/* Phone number warning modal */}
      {showPhoneWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Phone Number Required</h3>
            <p style={{ color: '#555' }}>A phone number is required before you can create a ticket.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => setShowPhoneWarning(false)} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowPhoneWarning(false); navigate('/settings') }} style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Go to Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Container */}
      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Create Ticket</h3>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Client */}
            <div>
              <label style={labelStyle}>Client *</label>
              <input style={inputStyle} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" required />
            </div>

            {/* Contact Person */}
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input style={inputStyle} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" required />
            </div>

            {/* Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address *</label>
              <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Complete address" required />
            </div>

            {/* Designation */}
            <div>
              <label style={labelStyle}>Designation *</label>
              <input style={inputStyle} value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Designation" required />
            </div>

            {/* Landline (optional) */}
            <div>
              <label style={labelStyle}>Landline <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
              <input style={inputStyle} value={landline} onChange={(e) => handleLandlineChange(e.target.value)} placeholder="e.g. (02) 1234-5678" />
            </div>

            {/* Department / Organization */}
            <div>
              <label style={labelStyle}>Department / Organization *</label>
              <input style={inputStyle} value={deptOrg} onChange={(e) => setDeptOrg(e.target.value)} placeholder="Department or organization" required />
            </div>

            {/* Mobile No. */}
            <div>
              <label style={labelStyle}>Mobile No. *</label>
              <input style={inputStyle} value={mobileNo} onChange={(e) => handleMobileChange(e.target.value)} placeholder="09XXXXXXXXX" required maxLength={11} />
            </div>

            {/* Email Address */}
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input style={inputStyle} type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="email@example.com" required />
            </div>

            {/* Type of Service dropdown */}
            <div>
              <label style={labelStyle}>Type of Service *</label>
              <select style={inputStyle} value={typeOfServiceId} onChange={(e) => setTypeOfServiceId(e.target.value)} required>
                <option value="">-- Select --</option>
                {typesOfService.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
                <option value="others">Others</option>
              </select>
            </div>

            {/* Others input */}
            {selectedOthers && (
              <div>
                <label style={labelStyle}>Please specify *</label>
                <input style={inputStyle} value={typeOfServiceOthers} onChange={(e) => setTypeOfServiceOthers(e.target.value)} placeholder="Specify service" required />
              </div>
            )}

            {/* Preferred Support Type */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Preferred Support Type *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {supportTypes.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setPreferredSupport(s.value)}
                    style={{
                      padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      border: preferredSupport === s.value ? '2px solid #2563eb' : '2px solid #e5e7eb',
                      background: preferredSupport === s.value ? '#dbeafe' : '#fff',
                      color: preferredSupport === s.value ? '#1d4ed8' : '#374151',
                    }}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            {/* Description of Problem */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description of Problem *</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={descProblem} onChange={(e) => setDescProblem(e.target.value)} placeholder="Describe the issue you're experiencing" required />
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button type="submit" style={{ padding: '10px 28px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Submit Ticket
            </button>
          </div>
        </form>
      </section>

      {/* Your Tickets list */}
      <section>
        <h3>Your Tickets</h3>
        {tickets.length === 0 ? (
          <p style={{ color: '#888' }}>No tickets yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>STF No.</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Date</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Client</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Status</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Priority</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontFamily: 'monospace' }}>{t.stf_no}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.date}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.client}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={statusBadge(t.status)}>
                      {t.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.priority || '\u2014'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewTicket(t)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>View</button>
                      {t.status === 'pending_feedback' && !t.csat_survey && (
                        <button onClick={() => handleOpenCSAT(t)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Rate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ───── CLIENT TICKET DETAIL MODAL ───── */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 800, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Ticket Details — {viewTicket.stf_no}</h2>
              <button onClick={() => setViewTicket(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>

            {/* Read-only ticket info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: 14, marginBottom: 16, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <div><strong>Date:</strong> {viewTicket.date}</div>
              <div><strong>Status:</strong> {viewTicket.status}</div>
              <div><strong>Client:</strong> {viewTicket.client || '—'}</div>
              <div><strong>Contact:</strong> {viewTicket.contact_person || '—'}</div>
              <div><strong>Priority:</strong> {viewTicket.priority || '—'}</div>
              <div><strong>Assigned To:</strong> {viewTicket.assigned_to?.username || 'Not yet assigned'}</div>
              <div><strong>Type of Service:</strong> {viewTicket.type_of_service_detail?.name || viewTicket.type_of_service_others || '—'}</div>
              <div><strong>Time In:</strong> {viewTicket.time_in ? new Date(viewTicket.time_in).toLocaleString() : '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {viewTicket.address || '—'}</div>
              <div><strong>Mobile:</strong> {viewTicket.mobile_no || '—'}</div>
              <div><strong>Email:</strong> {viewTicket.email_address || '—'}</div>
              <div><strong>Department/Org:</strong> {viewTicket.department_organization || '—'}</div>
              <div><strong>Designation:</strong> {viewTicket.designation || '—'}</div>
            </div>

            {/* Employee fields (read-only for client) */}
            {(viewTicket.action_taken || viewTicket.job_status) && (
              <div style={{ fontSize: 14, marginBottom: 16, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 15 }}>Employee Progress</h4>
                {viewTicket.action_taken && <div style={{ marginBottom: 4 }}><strong>Action Taken:</strong> {viewTicket.action_taken}</div>}
                {viewTicket.remarks && <div style={{ marginBottom: 4 }}><strong>Remarks:</strong> {viewTicket.remarks}</div>}
                {viewTicket.job_status && <div><strong>Job Status:</strong> {viewTicket.job_status?.replace(/_/g, ' ')}</div>}
              </div>
            )}

            {/* CSAT survey prompt inside modal */}
            {viewTicket.status === 'pending_feedback' && !viewTicket.csat_survey && (
              <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#92400e' }}>This ticket is pending your feedback.</p>
                <button onClick={() => { setViewTicket(null); handleOpenCSAT(viewTicket) }} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Rate &amp; Provide Feedback</button>
              </div>
            )}

            {/* Chat — only visible if ticket is assigned */}
            {viewTicket.assigned_to && currentUserId > 0 && (
              <div style={{ height: 350, marginBottom: 16 }}>
                <TicketChat ticketId={viewTicket.id} channelType="client_employee" currentUserId={currentUserId} currentUserRole="client" />
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setViewTicket(null)} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* \u2500\u2500\u2500\u2500\u2500 CSAT SURVEY MODAL \u2500\u2500\u2500\u2500\u2500 */}
      {csatTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 20 }}>Customer Satisfaction Survey</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>Ticket: {csatTicket.stf_no}</p>

            {/* Star rating */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>How would you rate the service? *</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCsatRating(star)}
                    style={{
                      fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                      color: star <= csatRating ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s',
                    }}
                  >\u2605</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0 0' }}>
                {csatRating === 1 ? 'Poor' : csatRating === 2 ? 'Fair' : csatRating === 3 ? 'Good' : csatRating === 4 ? 'Very Good' : csatRating === 5 ? 'Excellent' : 'Select a rating'}
              </p>
            </div>

            {/* Comments */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Comments <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={csatComments} onChange={(e) => setCsatComments(e.target.value)} placeholder="Any additional feedback..." />
            </div>

            {/* Other concerns */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={hasOtherConcerns} onChange={(e) => setHasOtherConcerns(e.target.checked)} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>I have other concerns</span>
              </label>
              {hasOtherConcerns && (
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical', marginTop: 8 }} value={otherConcernsText} onChange={(e) => setOtherConcernsText(e.target.value)} placeholder="Describe your other concerns..." />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCsatTicket(null)} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button
                onClick={handleSubmitCSAT}
                disabled={csatRating === 0 || csatSubmitting}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: csatRating === 0 ? '#d1d5db' : '#2563eb', color: '#fff', fontWeight: 600, cursor: csatRating === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}
              >{csatSubmitting ? 'Submitting...' : 'Submit Survey'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

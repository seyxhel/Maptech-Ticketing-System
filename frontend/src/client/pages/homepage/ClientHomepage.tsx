import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTickets, createTicket } from '../../../services/ticketService'
import { fetchTypesOfService, TypeOfService } from '../../../services/typeOfServiceService'
import { getCurrentUser } from '../../../services/authService'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#374151' }

export default function ClientHomepage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [showPhoneWarning, setShowPhoneWarning] = useState(false)
  const [typesOfService, setTypesOfService] = useState<TypeOfService[]>([])
  const navigate = useNavigate()

  // Form fields
  const [title, setTitle] = useState('')
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

  useEffect(() => {
    loadTickets()
    loadServices()
    ;(async () => {
      try {
        const u = await getCurrentUser()
        setUserPhone(u.phone || '')
      } catch { /* ignore */ }
    })()
  }, [])

  const loadTickets = async () => { setTickets(await fetchTickets()) }
  const loadServices = async () => { setTypesOfService(await fetchTypesOfService()) }

  const resetForm = () => {
    setTitle(''); setClient(''); setContactPerson(''); setAddress('')
    setDesignation(''); setLandline(''); setDeptOrg(''); setMobileNo('')
    setEmailAddress(''); setTypeOfServiceId(''); setTypeOfServiceOthers('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userPhone || !userPhone.trim()) { setShowPhoneWarning(true); return }
    const payload: Record<string, any> = {
      title,
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
            {/* Title — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ticket subject" required />
            </div>

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
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Title</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Status</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontFamily: 'monospace' }}>{t.stf_no}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.date}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.title}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 12, background: t.status === 'open' ? '#dbeafe' : t.status === 'closed' ? '#dcfce7' : '#fef3c7', color: t.status === 'open' ? '#1d4ed8' : t.status === 'closed' ? '#15803d' : '#92400e' }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.priority || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

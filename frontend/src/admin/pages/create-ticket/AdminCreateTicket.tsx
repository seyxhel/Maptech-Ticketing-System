import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { createTicket, fetchEmployees } from '../../../services/ticketService'
import { fetchTypesOfService, TypeOfService } from '../../../services/typeOfServiceService'
import { fetchClients, Client } from '../../../services/clientService'
import { fetchProducts, Product } from '../../../services/productService'
import { createCallLog, endCallLog } from '../../../services/callLogService'

/* ── styles ── */
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#374151' }
const sectionHeader: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#0E8F79', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderLeft: '4px solid #3BC25B', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
const btnPrimary: React.CSSProperties = { padding: '12px 28px', borderRadius: 8, border: 'none', background: '#3BC25B', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }

const CONTACT_FIELDS = [
  { name: 'client', label: 'Client', placeholder: 'e.g. Maptech Inc.', required: true },
  { name: 'contact_person', label: 'Contact Person', placeholder: 'e.g. Juan Dela Cruz', required: true },
  { name: 'landline', label: 'Landline No.', placeholder: 'e.g. (02) 1234-5678', required: false },
  { name: 'mobile_no', label: 'Mobile No.', placeholder: 'e.g. 09171234567', required: true },
  { name: 'designation', label: 'Designation', placeholder: 'e.g. IT Manager', required: true },
  { name: 'department_organization', label: 'Department / Organization', placeholder: 'e.g. Information Technology', required: true },
] as const

type ModalStep = 'none' | 'ongoing' | 'priority' | 'assign'

export default function AdminCreateTicket() {
  const navigate = useNavigate()

  // Client type toggle
  const [clientType, setClientType] = useState<'new' | 'existing'>('new')
  const [existingClients, setExistingClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')

  const [contactValues, setContactValues] = useState<Record<string, string>>({
    client: '', contact_person: '', landline: '', mobile_no: '', designation: '', department_organization: '',
  })
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [typeOfServiceId, setTypeOfServiceId] = useState<string>('')
  const [typeOfServiceOthers, setTypeOfServiceOthers] = useState('')
  const [estimatedResolutionDaysOverride, setEstimatedResolutionDaysOverride] = useState('')
  const [supportType, setSupportType] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const [typesOfService, setTypesOfService] = useState<(TypeOfService & { estimated_resolution_days?: number })[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  // Modal state
  const [modalStep, setModalStep] = useState<ModalStep>('none')
  const [priorityLevel, setPriorityLevel] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)

  // Call Log timer
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callElapsed, setCallElapsed] = useState(0)
  const [activeCallLogId, setActiveCallLogId] = useState<number | null>(null)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchTypesOfService().then(setTypesOfService).catch(() => {})
    fetchEmployees().then(setEmployees).catch(() => {})
    fetchClients().then(setExistingClients).catch(() => {})
    fetchProducts().then(setProducts).catch(() => {})
  }, [])

  // When existing client selected, pre-fill contact info
  useEffect(() => {
    if (clientType === 'existing' && selectedClientId) {
      const c = existingClients.find(cl => cl.id === selectedClientId)
      if (c) {
        setContactValues({
          client: c.client_name,
          contact_person: c.contact_person,
          landline: c.landline,
          mobile_no: c.mobile_no,
          designation: c.designation,
          department_organization: c.department_organization,
        })
        setEmail(c.email_address)
        setAddress(c.address)
      }
    }
  }, [clientType, selectedClientId, existingClients])

  // Call timer interval
  useEffect(() => {
    if (modalStep === 'ongoing' && callStartTime) {
      callTimerRef.current = setInterval(() => {
        setCallElapsed(Math.floor((Date.now() - callStartTime.getTime()) / 1000))
      }, 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current) }
  }, [modalStep, callStartTime])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const setContactField = (name: string, value: string) => {
    // Mobile: digits only, max 11
    if (name === 'mobile_no') {
      if (!/^\d*$/.test(value) || value.length > 11) return
    }
    // Landline: digits, parens, dashes, spaces
    if (name === 'landline') {
      if (!/^[0-9() -]*$/.test(value)) return
    }
    setContactValues((prev) => ({ ...prev, [name]: value }))
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: false }))
  }

  const selectedOthers = typeOfServiceId === 'others'

  const supportTypes = [
    { value: 'remote_online', label: 'Remote / Online' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'chat', label: 'Chat' },
    { value: 'call', label: 'Call' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, boolean> = {}
    if (clientType === 'existing' && !selectedClientId) newErrors['selectedClientId'] = true
    CONTACT_FIELDS.forEach((f) => {
      if (f.required && !contactValues[f.name]?.trim()) newErrors[f.name] = true
    })
    if (!email.trim()) newErrors['email'] = true
    if (!address.trim()) newErrors['address'] = true
    if (!typeOfServiceId) newErrors['typeOfServiceId'] = true
    if (selectedOthers && !typeOfServiceOthers.trim()) newErrors['typeOfServiceOthers'] = true
    if (selectedOthers && !estimatedResolutionDaysOverride) newErrors['estimatedResolutionDaysOverride'] = true
    if (!supportType) newErrors['supportType'] = true
    if (!description.trim()) newErrors['description'] = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill up all required fields.')
      return
    }
    // Start call flow — create call log via API
    try {
      const log = await createCallLog({
        client_name: contactValues.client,
        phone_number: contactValues.mobile_no,
        notes: description,
      })
      setActiveCallLogId(log.id)
      setCallStartTime(new Date(log.call_start))
      setCallElapsed(0)
      setModalStep('ongoing')
    } catch {
      toast.error('Failed to start call log.')
    }
  }

  const handleEndCall = useCallback(async () => {
    if (activeCallLogId) {
      try { await endCallLog(activeCallLogId) } catch { /* ignore */ }
    }
    setModalStep('priority')
    setPriorityLevel('')
  }, [activeCallLogId])

  const handleConfirmPriority = () => {
    if (!priorityLevel) {
      toast.error('Please select a priority level.')
      return
    }
    setModalStep('assign')
    setSelectedEmployee(null)
  }

  const handleAssign = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee to assign.')
      return
    }
    const emp = employees.find((e: any) => e.id === selectedEmployee)

    // Build payload
    const payload: Record<string, any> = {
      ...contactValues,
      email_address: email,
      address,
      description_of_problem: description,
      preferred_support_type: supportType,
      priority: priorityLevel.toLowerCase(),
      assign_to: selectedEmployee,
    }
    if (typeOfServiceId === 'others') {
      payload.type_of_service_others = typeOfServiceOthers
      if (estimatedResolutionDaysOverride) {
        payload.estimated_resolution_days_override = Number(estimatedResolutionDaysOverride)
      }
    } else if (typeOfServiceId) {
      payload.type_of_service = Number(typeOfServiceId)
    }
    if (clientType === 'existing' && selectedClientId) {
      payload.client_record = selectedClientId
      payload.is_existing_client = true
    }
    if (selectedProductId) {
      payload.product_record = selectedProductId
    }

    try {
      const result = await createTicket(payload)
      setModalStep('none')
      toast.success(`Ticket ${result.stf_no || ''} assigned to ${emp?.first_name || emp?.username || 'employee'}`, {
        autoClose: 4000,
      })
      navigate('/admin/dashboard')
    } catch {
      toast.error('Failed to create ticket.')
    }
  }

  const errorBorder = (field: string): React.CSSProperties =>
    errors[field] ? { border: '2px solid #ef4444' } : {}

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: '#111827' }}>SERVICE TICKET FORM</h1>
        <p style={{ color: '#0E8F79', fontWeight: 600, marginTop: 0 }}>Maptech Information Solutions Inc.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 14, color: '#6b7280', background: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid #e5e7eb', maxWidth: 500, margin: '0 auto' }}>
          <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
          <span><strong>Time In:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Contact Info */}
        <div style={cardStyle}>
          <h3 style={sectionHeader}>1. Contact Information</h3>

          {/* New / Existing Client Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['new', 'existing'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setClientType(t); setSelectedClientId(''); if (t === 'new') setContactValues({ client: '', contact_person: '', landline: '', mobile_no: '', designation: '', department_organization: '' }); setEmail(''); setAddress('') }}
                style={{ padding: '8px 20px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: clientType === t ? '2px solid #0E8F79' : '2px solid #e5e7eb', background: clientType === t ? '#0E8F79' : '#fff', color: clientType === t ? '#fff' : '#374151', transition: 'all 0.15s' }}>
                {t === 'new' ? '+ New Client' : '📋 Existing Client'}
              </button>
            ))}
          </div>

          {clientType === 'existing' && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select Client Record <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                style={{ ...inputStyle, ...errorBorder('selectedClientId') }}
                value={selectedClientId}
                onChange={e => { setSelectedClientId(e.target.value ? Number(e.target.value) : ''); setErrors(p => ({ ...p, selectedClientId: false })) }}
              >
                <option value="">-- Select a client --</option>
                {existingClients.map(c => <option key={c.id} value={c.id}>{c.client_name} — {c.contact_person}</option>)}
              </select>
              {errors['selectedClientId'] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>Please select a client</p>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {CONTACT_FIELDS.map((f) => (
              <div key={f.name}>
                <label style={labelStyle}>{f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                <input
                  style={{ ...inputStyle, ...errorBorder(f.name), ...(clientType === 'existing' && selectedClientId ? { background: '#f3f4f6' } : {}) }}
                  placeholder={f.placeholder}
                  value={contactValues[f.name]}
                  onChange={(e) => setContactField(f.name, e.target.value)}
                  readOnly={clientType === 'existing' && !!selectedClientId}
                />
                {errors[f.name] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>This field is required</p>}
              </div>
            ))}
            <div>
              <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="email"
                style={{ ...inputStyle, ...errorBorder('email') }}
                placeholder="e.g. juandelacruz@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, email: false })) }}
              />
              {errors['email'] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>This field is required</p>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Address <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                rows={2}
                style={{ ...inputStyle, ...errorBorder('address'), resize: 'none' as const }}
                placeholder="e.g. 123 Main Street, Quezon City, Metro Manila"
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, address: false })) }}
              />
              {errors['address'] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>This field is required</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Type of Service */}
        <div style={cardStyle}>
          <h3 style={sectionHeader}>2. Type of Service <span style={{ color: '#ef4444' }}>*</span></h3>
          {errors['typeOfServiceId'] && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -8 }}>Please select a type of service</p>}
          <select
            style={{ ...inputStyle, ...errorBorder('typeOfServiceId') }}
            value={typeOfServiceId}
            onChange={(e) => { setTypeOfServiceId(e.target.value); setErrors((p) => ({ ...p, typeOfServiceId: false })) }}
          >
            <option value="">-- Select Type of Service --</option>
            {typesOfService.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
            <option value="others">Others</option>
          </select>
          {selectedOthers && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Please specify <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={{ ...inputStyle, ...errorBorder('typeOfServiceOthers') }}
                placeholder="Specify the service..."
                value={typeOfServiceOthers}
                onChange={(e) => { setTypeOfServiceOthers(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, typeOfServiceOthers: false })) }}
              />
              {errors['typeOfServiceOthers'] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>Please specify the service</p>}
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Estimated Resolution Days <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  min="1"
                  style={{ ...inputStyle, ...errorBorder('estimatedResolutionDaysOverride'), maxWidth: 200 }}
                  placeholder="e.g. 5"
                  value={estimatedResolutionDaysOverride}
                  onChange={(e) => { setEstimatedResolutionDaysOverride(e.target.value); setErrors(p => ({ ...p, estimatedResolutionDaysOverride: false })) }}
                />
                {errors['estimatedResolutionDaysOverride'] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>Required for Others</p>}
              </div>
            </div>
          )}
          {!selectedOthers && typeOfServiceId && (() => {
            const tos = typesOfService.find(s => String(s.id) === typeOfServiceId)
            return tos?.estimated_resolution_days ? (
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>SLA Estimated Resolution: <strong>{tos.estimated_resolution_days} day(s)</strong></p>
            ) : null
          })()}
        </div>

        {/* Section 2b: Product Record (optional) */}
        <div style={cardStyle}>
          <h3 style={sectionHeader}>Product Information <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>(Optional)</span></h3>
          <select
            style={inputStyle}
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">-- Select a product (optional) --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.product_name} — {p.brand} {p.model_name}</option>)}
          </select>
          {selectedProductId && (() => {
            const p = products.find(pr => pr.id === selectedProductId)
            return p ? (
              <div style={{ marginTop: 12, background: '#f9fafb', borderRadius: 8, padding: 12, fontSize: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <span><strong>Brand:</strong> {p.brand}</span>
                  <span><strong>Model:</strong> {p.model_name}</span>
                  <span><strong>Serial:</strong> {p.serial_no || 'N/A'}</span>
                  <span><strong>Sales No:</strong> {p.sales_no || 'N/A'}</span>
                  <span><strong>Warranty:</strong> {p.has_warranty ? 'Yes' : 'No'}</span>
                  <span><strong>Purchased:</strong> {p.date_purchased || 'N/A'}</span>
                </div>
              </div>
            ) : null
          })()}
        </div>

        {/* Section 3: Support Type */}
        <div style={cardStyle}>
          <h3 style={sectionHeader}>3. Preferred Type of Support <span style={{ color: '#ef4444' }}>*</span></h3>
          {errors['supportType'] && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -8 }}>Please select a support type</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {supportTypes.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => { setSupportType(s.value); setErrors((p) => ({ ...p, supportType: false })) }}
                style={{
                  padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  border: supportType === s.value ? '2px solid #0E8F79' : '2px solid #e5e7eb',
                  background: supportType === s.value ? '#0E8F79' : '#fff',
                  color: supportType === s.value ? '#fff' : '#374151',
                  transition: 'all 0.15s',
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Section 4: Description */}
        <div style={cardStyle}>
          <h3 style={sectionHeader}>4. Description of Problem <span style={{ color: '#ef4444' }}>*</span></h3>
          <textarea
            rows={6}
            style={{ ...inputStyle, ...errorBorder('description'), resize: 'vertical' as const }}
            placeholder="Please describe the problem in detail. Include any error messages, steps to reproduce, and when the issue started..."
            value={description}
            onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, description: false })) }}
          />
          {errors['description'] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>This field is required</p>}
        </div>

        <div style={{ paddingTop: 8 }}>
          <button type="submit" style={btnPrimary}>Submit Service Ticket</button>
        </div>
      </form>

      {/* ── Modal Flow: calling → ongoing → priority → assign ── */}
      {modalStep !== 'none' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: 420, overflow: 'hidden' }}>

            {/* Call Ongoing — real timer */}
            {modalStep === 'ongoing' && (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 36 }}>📞</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Call Connected</h3>
                <p style={{ color: '#6b7280', marginBottom: 8 }}>
                  {contactValues.contact_person || 'Client'} — {contactValues.mobile_no || 'N/A'}
                </p>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#22c55e', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{formatTimer(callElapsed)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 20, fontSize: 14, fontWeight: 600, marginBottom: 28 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} /> Ongoing Call
                </div>
                <div>
                  <button
                    onClick={handleEndCall}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                  >
                    📵 End Call
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Priority Level Selection */}
            {modalStep === 'priority' && (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Set Priority Level</h3>
                    <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>Select the priority for this ticket</p>
                  </div>
                  <button onClick={() => setModalStep('none')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Low', color: '#3b82f6', bg: '#dbeafe' },
                    { label: 'Medium', color: '#eab308', bg: '#fef9c3' },
                    { label: 'High', color: '#f97316', bg: '#ffedd5' },
                    { label: 'Critical', color: '#ef4444', bg: '#fee2e2' },
                  ].map(({ label, color, bg }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPriorityLevel(label)}
                      style={{
                        padding: '16px 12px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                        border: priorityLevel === label ? `2px solid ${color}` : `2px solid ${bg}`,
                        background: priorityLevel === label ? color : bg,
                        color: priorityLevel === label ? '#fff' : color,
                        transition: 'all 0.15s',
                      }}
                    >{label}</button>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={handleConfirmPriority}
                    style={{ ...btnPrimary, fontSize: 14, padding: '10px 20px' }}
                  >Confirm Priority</button>
                </div>
              </div>
            )}

            {/* Step 4: Assign Employee */}
            {modalStep === 'assign' && (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Assign Employee</h3>
                    <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>Select an employee to handle this ticket</p>
                  </div>
                  <button onClick={() => setModalStep('none')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                </div>

                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Priority:</span>
                    <span style={{
                      fontWeight: 700,
                      color: priorityLevel === 'Critical' ? '#ef4444' : priorityLevel === 'High' ? '#f97316' : priorityLevel === 'Medium' ? '#eab308' : '#3b82f6',
                    }}>{priorityLevel}</span>
                  </div>
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {employees.map((emp: any) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8,
                        border: selectedEmployee === emp.id ? '2px solid #3BC25B' : '1px solid #e5e7eb',
                        background: selectedEmployee === emp.id ? '#f0fdf4' : '#fff',
                        cursor: 'pointer', textAlign: 'left' as const, marginBottom: 8,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                        background: selectedEmployee === emp.id ? '#3BC25B' : '#e5e7eb',
                        color: selectedEmployee === emp.id ? '#fff' : '#6b7280',
                      }}>
                        {((emp.first_name || emp.username || 'U')[0] + (emp.last_name || '')[0] || '').toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                          {emp.first_name} {emp.last_name || ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{emp.username}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {emp.active_ticket_count !== undefined && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: emp.active_ticket_count === 0 ? '#dcfce7' : '#fef3c7', color: emp.active_ticket_count === 0 ? '#15803d' : '#92400e', fontWeight: 600 }}>
                            {emp.active_ticket_count} active
                          </span>
                        )}
                        {selectedEmployee === emp.id && <span style={{ color: '#3BC25B', fontWeight: 700, fontSize: 18 }}>✓</span>}
                      </div>
                    </button>
                  ))}
                  {employees.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 16 }}>No employees available.</p>}
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={handleAssign}
                    style={{ ...btnPrimary, fontSize: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    ✓ Assign Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

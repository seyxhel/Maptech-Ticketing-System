import React, { useState, useEffect, useRef } from 'react'
import { fetchTickets, updateEmployeeFields, uploadAttachments, deleteAttachment } from '../../services/ticketService'
import { getCurrentUser } from '../../services/authService'
import TicketChat from '../../shared/components/TicketChat'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#374151' }
const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }

export default function EmployeeDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [viewTicket, setViewTicket] = useState<any | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number>(0)
  const [chatTab, setChatTab] = useState<'client' | 'admin'>('client')

  // Employee-editable fields
  const [preferredSupport, setPreferredSupport] = useState('')
  const [hasWarranty, setHasWarranty] = useState(false)
  const [product, setProduct] = useState('')
  const [brand, setBrand] = useState('')
  const [modelName, setModelName] = useState('')
  const [deviceEquipment, setDeviceEquipment] = useState('')
  const [versionNo, setVersionNo] = useState('')
  const [datePurchased, setDatePurchased] = useState('')
  const [serialNo, setSerialNo] = useState('')
  const [descProblem, setDescProblem] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [remarks, setRemarks] = useState('')
  const [jobStatus, setJobStatus] = useState('')

  // Attachments
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Media preview lightbox
  const [previewMedia, setPreviewMedia] = useState<{ url: string; isVideo: boolean } | null>(null)

  useEffect(() => {
    loadTickets()
    ;(async () => {
      try { const u = await getCurrentUser(); setCurrentUserId(u.id) } catch { /* ignore */ }
    })()
  }, [])

  const loadTickets = async () => { setTickets(await fetchTickets()) }

  const openDetail = (t: any) => {
    setViewTicket(t)
    setPreferredSupport(t.preferred_support_type || '')
    setHasWarranty(!!t.has_warranty)
    setProduct(t.product || '')
    setBrand(t.brand || '')
    setModelName(t.model_name || '')
    setDeviceEquipment(t.device_equipment || '')
    setVersionNo(t.version_no || '')
    setDatePurchased(t.date_purchased || '')
    setSerialNo(t.serial_no || '')
    setDescProblem(t.description_of_problem || '')
    setActionTaken(t.action_taken || '')
    setRemarks(t.remarks || '')
    setJobStatus(t.job_status || '')
    setPendingFiles([])
  }
  const closeDetail = () => { setViewTicket(null); setPendingFiles([]) }

  const handleSave = async () => {
    if (!viewTicket) return
    const payload: Record<string, any> = {
      preferred_support_type: preferredSupport,
      has_warranty: hasWarranty,
      product,
      brand,
      model_name: modelName,
      device_equipment: deviceEquipment,
      version_no: versionNo,
      date_purchased: datePurchased || null,
      serial_no: serialNo,
      description_of_problem: descProblem,
      action_taken: actionTaken,
      remarks,
      job_status: jobStatus,
    }
    const updated = await updateEmployeeFields(viewTicket.id, payload)
    // Upload pending files
    if (pendingFiles.length > 0) {
      await uploadAttachments(viewTicket.id, pendingFiles)
      setPendingFiles([])
    }
    // Reload
    const refreshed = await fetchTickets()
    setTickets(refreshed)
    const fresh = refreshed.find((t: any) => t.id === viewTicket.id) || updated
    setViewTicket(fresh)
  }

  const handleDeleteAttachment = async (attId: number) => {
    if (!viewTicket) return
    await deleteAttachment(viewTicket.id, attId)
    const refreshed = await fetchTickets()
    setTickets(refreshed)
    setViewTicket(refreshed.find((t: any) => t.id === viewTicket.id) || viewTicket)
  }

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    setPendingFiles(prev => [...prev, ...files])
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
      setPendingFiles(prev => [...prev, ...files])
    }
  }
  const removePending = (idx: number) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))

  const supportTypes = [
    { value: 'remote_online', label: 'Remote/Online' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'chat', label: 'Chat' },
    { value: 'call', label: 'Call' },
  ]

  const jobStatuses = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_warranty', label: 'Under Warranty' },
    { value: 'chargeable', label: 'Chargeable' },
    { value: 'for_quotation', label: 'For Quotation' },
    { value: 'under_contract', label: 'Under Contract' },
  ]

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h1>Employee Dashboard</h1>

      <section>
        <h3>Assigned Tickets</h3>
        {tickets.length === 0 ? (
          <p style={{ color: '#888' }}>No tickets assigned to you.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                {['STF No.', 'Date', 'Client', 'Status', 'Priority', 'Job Status', ''].map(h => (
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
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.status}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.priority || '—'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{t.job_status || '—'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <button style={{ ...btnPrimary, padding: '5px 14px', fontSize: 12 }} onClick={() => openDetail(t)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ───── TICKET DETAIL MODAL ───── */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Ticket Details — {viewTicket.stf_no}</h2>
              <button onClick={closeDetail} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>

            {/* Read-only ticket info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: 14, marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <div><strong>Date:</strong> {viewTicket.date}</div>
              <div><strong>Status:</strong> {viewTicket.status}</div>
              <div><strong>Client:</strong> {viewTicket.client || '—'}</div>
              <div><strong>Contact:</strong> {viewTicket.contact_person || '—'}</div>
              <div><strong>Priority:</strong> {viewTicket.priority || '—'}</div>
              <div><strong>Time In:</strong> {viewTicket.time_in ? new Date(viewTicket.time_in).toLocaleString() : '—'}</div>
              <div><strong>Type of Service:</strong> {viewTicket.type_of_service_detail?.name || viewTicket.type_of_service_others || '—'}</div>
              <div><strong>Email:</strong> {viewTicket.email_address || '—'}</div>
            </div>

            {/* Preferred Type of Support */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Preferred Type of Support</label>
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

            {/* Product Details */}
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <legend style={{ fontWeight: 700, fontSize: 14, padding: '0 8px' }}>Product Details</legend>

              {/* Warranty Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Warranty</label>
                <button
                  type="button"
                  onClick={() => setHasWarranty(!hasWarranty)}
                  style={{
                    position: 'relative', width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: hasWarranty ? '#2563eb' : '#d1d5db', transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: hasWarranty ? 24 : 3,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: hasWarranty ? '#2563eb' : '#6b7280' }}>
                  {hasWarranty ? 'W/ Warranty' : 'W/O Warranty'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Product <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Laptop, Printer" />
                </div>
                <div>
                  <label style={labelStyle}>Brand <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input style={inputStyle} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Dell, HP" />
                </div>
                <div>
                  <label style={labelStyle}>Model <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input style={inputStyle} value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. Latitude 5520" />
                </div>
                <div>
                  <label style={labelStyle}>Device/Equipment</label>
                  <input style={inputStyle} value={deviceEquipment} onChange={(e) => setDeviceEquipment(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Version No.</label>
                  <input style={inputStyle} value={versionNo} onChange={(e) => setVersionNo(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Date Purchased</label>
                  <input style={inputStyle} type="date" value={datePurchased} onChange={(e) => setDatePurchased(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Serial No.</label>
                  <input style={inputStyle} value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
                </div>
              </div>
            </fieldset>

            {/* Description of Problem */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description of Problem</label>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={descProblem} onChange={(e) => setDescProblem(e.target.value)} />
            </div>

            {/* Action Taken */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Action Taken</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Remarks</label>
              <textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>

            {/* Required Attachments — drag & drop */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Required Attachments</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#2563eb' : '#d1d5db'}`,
                  borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer',
                  background: isDragging ? '#eff6ff' : '#f9fafb', transition: 'all 0.2s',
                }}
              >
                <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                  Drag & drop images/videos here, or <span style={{ color: '#2563eb', fontWeight: 600 }}>click to browse</span>
                </p>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </div>
              {/* Existing attachments */}
              {viewTicket.attachments && viewTicket.attachments.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {viewTicket.attachments.map((att: any) => {
                    const isImage = att.file && att.file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    const isVideo = att.file && att.file.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                    return (
                      <div
                        key={att.id}
                        style={{ position: 'relative', width: 80, height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', cursor: (isImage || isVideo) ? 'pointer' : 'default' }}
                        onClick={() => { if (isImage || isVideo) setPreviewMedia({ url: att.file, isVideo: !!isVideo }) }}
                      >
                        {isImage ? (
                          <img src={att.file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : isVideo ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 11, color: '#6b7280' }}>
                            <span style={{ fontSize: 24, marginBottom: 2 }}>&#9654;</span>
                            Video
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 11, color: '#6b7280' }}>File</div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(att.id) }}
                          style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                        >&times;</button>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Pending files */}
              {pendingFiles.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <strong>Pending upload:</strong>
                  {pendingFiles.map((f, i) => (
                    <span key={i} style={{ marginLeft: 8, background: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                      {f.name} <button onClick={() => removePending(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status of Job */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Status of Job</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {jobStatuses.map((js) => (
                  <button
                    key={js.value}
                    type="button"
                    onClick={() => setJobStatus(js.value)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      border: jobStatus === js.value ? '2px solid #2563eb' : '2px solid #e5e7eb',
                      background: jobStatus === js.value ? '#dbeafe' : '#fff',
                      color: jobStatus === js.value ? '#1d4ed8' : '#374151',
                    }}
                  >{js.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 20 }}>
              <button style={btnSecondary} onClick={closeDetail}>Close</button>
              <button style={btnPrimary} onClick={handleSave}>Save Changes</button>
            </div>

            {/* ── Chat Section (two channels) ── */}
            {currentUserId > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Messages</label>
                <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
                  <button
                    onClick={() => setChatTab('client')}
                    style={{
                      padding: '8px 16px', cursor: 'pointer', border: 'none',
                      borderBottom: chatTab === 'client' ? '3px solid #2563eb' : '3px solid transparent',
                      background: 'none', fontWeight: chatTab === 'client' ? 700 : 400,
                      color: chatTab === 'client' ? '#2563eb' : '#6b7280', fontSize: 13,
                    }}
                  >Client Chat</button>
                  <button
                    onClick={() => setChatTab('admin')}
                    style={{
                      padding: '8px 16px', cursor: 'pointer', border: 'none',
                      borderBottom: chatTab === 'admin' ? '3px solid #2563eb' : '3px solid transparent',
                      background: 'none', fontWeight: chatTab === 'admin' ? 700 : 400,
                      color: chatTab === 'admin' ? '#2563eb' : '#6b7280', fontSize: 13,
                    }}
                  >Admin Chat</button>
                </div>
                <div style={{ height: 320 }}>
                  {chatTab === 'client' ? (
                    <TicketChat ticketId={viewTicket.id} channelType="client_employee" currentUserId={currentUserId} currentUserRole="employee" />
                  ) : (
                    <TicketChat ticketId={viewTicket.id} channelType="admin_employee" currentUserId={currentUserId} currentUserRole="employee" />
                  )}
                </div>
              </div>
            )}

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

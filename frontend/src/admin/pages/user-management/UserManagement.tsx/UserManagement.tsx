import React, { useState, useEffect } from 'react'
import { fetchUsers, createUser } from '../../../../services/userService'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    phone: '',
    role: 'employee',
  })
  const [addErrors, setAddErrors] = useState<{ [k: string]: string }>({})
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      if (Array.isArray(data)) setUsers(data)
    } catch {
      /* ignore */
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const generatedUsername = (() => {
    const sanitize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const f = sanitize(addForm.first_name)
    const m = sanitize(addForm.middle_name)
    const l = sanitize(addForm.last_name)
    const midInitial = m ? m[0] : ''
    return midInitial ? `${f}${midInitial}${l}` : `${f}${l}`
  })()

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddErrors({})
    setAddSuccess(null)
    const errs: { [k: string]: string } = {}
    if (!addForm.first_name.trim()) errs.first_name = 'First name is required.'
    if (!addForm.last_name.trim()) errs.last_name = 'Last name is required.'
    if (!addForm.email.trim()) errs.email = 'Email is required.'
    if (Object.keys(errs).length) {
      setAddErrors(errs)
      return
    }
    setSubmitting(true)
    try {
      const res = await createUser({
        first_name: addForm.first_name.trim(),
        middle_name: addForm.middle_name.trim(),
        last_name: addForm.last_name.trim(),
        suffix: addForm.suffix,
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        role: addForm.role,
      })
      if (res.ok) {
        setAddSuccess(`User "${res.data.username}" created successfully with default password.`)
        setAddForm({ first_name: '', middle_name: '', last_name: '', suffix: '', email: '', phone: '', role: 'employee' })
        loadUsers()
      } else {
        const d = res.data
        const mapped: { [k: string]: string } = {}
        for (const key of Object.keys(d)) {
          mapped[key] = Array.isArray(d[key]) ? d[key].join(' ') : String(d[key])
        }
        setAddErrors(mapped)
      }
    } catch {
      setAddErrors({ general: 'Failed to create user.' })
    }
    setSubmitting(false)
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.middle_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ padding: 20 }}>
      <h1>User Management</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px 12px', width: 300, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          onClick={() => {
            setShowAddModal(true)
            setAddErrors({})
            setAddSuccess(null)
          }}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Add User
        </button>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>ID</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Username</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Name</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Email</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Phone</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#888' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 12px' }}>{u.id}</td>
                  <td style={{ padding: '8px 12px' }}>{u.username}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {u.first_name} {u.middle_name ? u.middle_name + ' ' : ''}
                    {u.last_name}
                    {u.suffix ? ' ' + u.suffix : ''}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{u.email}</td>
                  <td style={{ padding: '8px 12px' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background: u.role === 'admin' ? '#fee2e2' : u.role === 'employee' ? '#dbeafe' : '#d1fae5',
                        color: u.role === 'admin' ? '#991b1b' : u.role === 'employee' ? '#1e40af' : '#065f46',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Add User Modal */}
      {showAddModal && (
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
              width: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Add New User</h2>
            {addSuccess && (
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '8px 12px', borderRadius: 4, marginBottom: 12 }}>
                {addSuccess}
              </div>
            )}
            {addErrors.general && <div style={{ color: 'red', marginBottom: 8 }}>{addErrors.general}</div>}
            <form onSubmit={handleAddUser}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>First Name *</label>
                  <input
                    value={addForm.first_name}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase())
                      setAddForm((prev) => ({ ...prev, first_name: v }))
                    }}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                  />
                  {addErrors.first_name && <div style={{ color: 'red', fontSize: 12 }}>{addErrors.first_name}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Middle Name</label>
                  <input
                    value={addForm.middle_name}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase())
                      setAddForm((prev) => ({ ...prev, middle_name: v }))
                    }}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Last Name *</label>
                  <input
                    value={addForm.last_name}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase())
                      setAddForm((prev) => ({ ...prev, last_name: v }))
                    }}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                  />
                  {addErrors.last_name && <div style={{ color: 'red', fontSize: 12 }}>{addErrors.last_name}</div>}
                </div>
                <div style={{ flex: 0.5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Suffix</label>
                  <select
                    value={addForm.suffix}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, suffix: e.target.value }))}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                  >
                    <option value="">None</option>
                    <option value="Jr">Jr</option>
                    <option value="Sr">Sr</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                />
                {addErrors.email && <div style={{ color: 'red', fontSize: 12 }}>{addErrors.email}</div>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Phone</label>
                <input
                  type="tel"
                  maxLength={11}
                  value={addForm.phone}
                  onChange={(e) => {
                    const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 11)
                    setAddForm((prev) => ({ ...prev, phone: digits }))
                  }}
                  style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Role *</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f3f4f6', borderRadius: 4 }}>
                <span style={{ fontSize: 12, color: '#666' }}>Auto-generated username: </span>
                <strong>{generatedUsername || '—'}</strong>
                <br />
                <span style={{ fontSize: 11, color: '#999' }}>Default password: password123</span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setAddErrors({})
                    setAddSuccess(null)
                    setAddForm({ first_name: '', middle_name: '', last_name: '', suffix: '', email: '', phone: '', role: 'employee' })
                  }}
                  style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
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
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

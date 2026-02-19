import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

export default function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Hide nav links on auth/protected pages
  const hideNavLinks =
    location.pathname === '/login' ||
    location.pathname === '/homepage' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/register/') ||
    location.pathname.startsWith('/employee/') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/settings'

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
      <div>
        {!hideNavLinks && (
          <>
            <Link to="/">Home</Link>
            {' | '}
            <Link to="/login">Login</Link>
            {' | '}
            <Link to="/register">Register</Link>
          </>
        )}
        {user && location.pathname !== '/login' && user.role === 'admin' && (
          <>
            {' '}
            <Link to="/admin/user-management">User Management</Link>
          </>
        )}
      </div>

      {/* Profile icon + dropdown */}
      {user && location.pathname !== '/login' ? (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            title={user.username}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {(user.username || 'U')[0].toUpperCase()}
          </button>
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: 180,
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.username}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{user.role}</div>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/settings')
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  logout()
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#dc2626',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

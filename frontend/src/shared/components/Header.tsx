import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
      <div>
        {location.pathname !== '/login' &&
          location.pathname !== '/homepage' &&
          location.pathname !== '/register' &&
          location.pathname !== '/forgot-password' &&
          location.pathname !== '/register/complete-profile' &&
          !location.pathname.startsWith('/register/complete-profile') &&
          location.pathname !== '/employee/dashboard' &&
          !location.pathname.startsWith('/employee/dashboard') &&
          !location.pathname.startsWith('/admin') && (
            <>
              <Link to="/">Home</Link>
              {' | '}
              <Link to="/login">Login</Link>
              {' | '}
              <Link to="/register">Register</Link>
            </>
          )}
        {location.pathname !== '/login' && user?.role === 'admin' && (
          <>
            {' '}
            <Link to="/admin/user-management">User Management</Link>
          </>
        )}
      </div>
      {user && location.pathname !== '/login' ? (
        <>
          <strong>{user.username}</strong> ({user.role}){' '}
          <button onClick={logout}>Logout</button>
        </>
      ) : null}
    </div>
  )
}

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCookie } from '../../utils/auth'

type Props = {
  children: React.ReactNode
  role?: string | string[]
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, authChecked, roleRedirectPath } = useAuth()

  if (!user) {
    const access = getCookie('access')
    if (access && !authChecked) return null
    return <Navigate to="/login" replace />
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) return <Navigate to={roleRedirectPath(user)} replace />
  }

  return <>{children}</>
}

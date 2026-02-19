import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, getCookie, setCookie, deleteCookie, parseUserFromJWT, roleRedirectPath } from '../utils/auth'
import { login as apiLogin, getCurrentUser } from '../services/authService'

type AuthContextType = {
  user: User | null
  authChecked: boolean
  login: (payload: { username: string; password: string }) => Promise<any>
  logout: () => void
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  roleRedirectPath: (u: User | null) => string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = getCookie('access')
    if (!raw) return null
    const parsed = parseUserFromJWT(raw)
    if (!parsed || !parsed.role) return null
    return parsed
  })
  const [authChecked, setAuthChecked] = useState(false)
  const navigate = useNavigate()

  // On mount, restore session from access cookie
  useEffect(() => {
    const tryRestore = async () => {
      if (!user) {
        const access = getCookie('access')
        if (access) {
          try {
            const current = await getCurrentUser()
            if (current && current.id) {
              setUser(current)
              navigate(roleRedirectPath(current))
            }
          } catch {
            // ignore — user stays unauthenticated
          }
        }
      }
      setAuthChecked(true)
    }
    tryRestore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (payload: { username: string; password: string }) => {
    const res = await apiLogin(payload)
    if (res.token || res.access) {
      const accessToken = res.access || res.token
      const refreshToken = res.refresh || null
      if (accessToken) setCookie('access', accessToken)
      if (refreshToken) setCookie('refresh', refreshToken)
      try {
        const current = await getCurrentUser()
        setUser(current)
        navigate(roleRedirectPath(current))
      } catch {
        const parsed = accessToken ? parseUserFromJWT(accessToken) : res.user || null
        setUser(parsed)
        navigate(roleRedirectPath(parsed))
      }
    }
    return res
  }

  const logout = () => {
    deleteCookie('access')
    deleteCookie('refresh')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, authChecked, login, logout, setUser, roleRedirectPath }}>
      {children}
    </AuthContext.Provider>
  )
}

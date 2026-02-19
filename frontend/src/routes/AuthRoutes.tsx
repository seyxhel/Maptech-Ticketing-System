import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../authentication/pages/LoginPage'
import ClientRegister from '../authentication/pages/ClientRegister'
import ForgotPassword from '../authentication/pages/ForgotPassword'
import { useAuth } from '../context/AuthContext'

export default function AuthRoutes() {
  const { user, roleRedirectPath } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to={roleRedirectPath(user)} replace /> : <Navigate to="/login" replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<ClientRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './shared/components/Header'
import NotFoundPage from './shared/not-found-page/NotFoundPage'
import LoginPage from './authentication/pages/LoginPage'
import ClientRegister from './authentication/pages/ClientRegister'
import ForgotPassword from './authentication/pages/ForgotPassword'
import ClientHomepage from './client/pages/homepage/ClientHomepage'
import EmployeeDashboard from './employee/pages/EmployeeDashboard'
import AdminDashboard from './admin/pages/dashboard/AdminDashboard'
import UserManagement from './admin/pages/user-management/UserManagement.tsx/UserManagement'
import SettingsPage from './shared/pages/SettingsPage'
import ProtectedRoute from './shared/components/ProtectedRoute'

function AppRoutes() {
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
      <Route
        path="/homepage"
        element={
          <ProtectedRoute role="client">
            <ClientHomepage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/user-management"
        element={
          <ProtectedRoute role="admin">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <AuthProvider>
          <Header />
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App

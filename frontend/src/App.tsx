import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './shared/components/Header'
import NotFoundPage from './shared/not-found-page/NotFoundPage'
import LoginPage from './authentication/pages/LoginPage'
import ForgotPassword from './authentication/pages/ForgotPassword'
import EmployeeDashboard from './employee/pages/EmployeeDashboard'
import AdminDashboard from './admin/pages/dashboard/AdminDashboard'
import AdminCreateTicket from './admin/pages/create-ticket/AdminCreateTicket'
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
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
          <ProtectedRoute role={['admin', 'superadmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-ticket"
        element={
          <ProtectedRoute role={['admin', 'superadmin']}>
            <AdminCreateTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/user-management"
        element={
          <ProtectedRoute role="superadmin">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <AuthProvider>
        <Header />
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

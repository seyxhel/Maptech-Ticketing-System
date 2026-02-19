import { Routes, Route } from 'react-router-dom'
import AdminDashboard from '../admin/pages/dashboard/AdminDashboard'
import UserManagement from '../admin/pages/user-management/UserManagement.tsx/UserManagement'
import ProtectedRoute from '../shared/components/ProtectedRoute'

export default function AdminRoutes() {
  return (
    <Routes>
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
    </Routes>
  )
}

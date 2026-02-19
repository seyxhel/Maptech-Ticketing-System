import { Routes, Route } from 'react-router-dom'
import EmployeeDashboard from '../employee/pages/EmployeeDashboard'
import ProtectedRoute from '../shared/components/ProtectedRoute'

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

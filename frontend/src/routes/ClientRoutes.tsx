import { Routes, Route } from 'react-router-dom'
import ClientHomepage from '../client/pages/homepage/ClientHomepage'
import ProtectedRoute from '../shared/components/ProtectedRoute'

export default function ClientRoutes() {
  return (
    <Routes>
      <Route
        path="/homepage"
        element={
          <ProtectedRoute role="client">
            <ClientHomepage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

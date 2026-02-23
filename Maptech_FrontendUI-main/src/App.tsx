import React from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { ClientLayout } from './layouts/ClientLayout';

import SuperAdminDashboard from './pages/superadmin/dashboard';
import SuperAdminUsers from './pages/superadmin/users';
import SuperAdminReports from './pages/superadmin/reports';
import SuperAdminSettings from './pages/superadmin/settings';

import AdminDashboard from './pages/admin/dashboard';
import AdminTickets from './pages/admin/tickets';
import AdminEscalation from './pages/admin/escalation';
import AdminReports from './pages/admin/reports';
import AdminCreateTicket from './pages/admin/create-ticket';
import AdminTicketDetails from './pages/admin/ticket-details';
import AdminSettings from './pages/admin/settings';

import EmployeeDashboard from './pages/employee/dashboard';
import EmployeeMyTickets from './pages/employee/my-tickets';
import EmployeeTicketDetails from './pages/employee/ticket-details';
import EmployeeKnowledgeBase from './pages/employee/knowledge-base';
import EmployeeSettings from './pages/employee/settings';

import ClientDashboard from './pages/client/dashboard';
import ClientCreateTicket from './pages/client/create-ticket';
import ClientMyTickets from './pages/client/my-tickets';
import ClientTicketDetails from './pages/client/ticket-details';
import ClientSettings from './pages/client/settings';

function RootRedirect() {
  const { user, getRedirectPath } = useAuth();
  if (user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}

export function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<RootRedirect />} />

            <Route
              path="/superadmin"
              element={
                <ProtectedRoute allowedRole="superadmin">
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="users" element={<SuperAdminUsers />} />
              <Route path="reports" element={<SuperAdminReports />} />
              <Route path="settings" element={<SuperAdminSettings />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="escalation" element={<AdminEscalation />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="create-ticket" element={<AdminCreateTicket />} />
              <Route path="ticket-details" element={<AdminTicketDetails />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRole="employee">
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="my-tickets" element={<EmployeeMyTickets />} />
              <Route path="ticket-details" element={<EmployeeTicketDetails />} />
              <Route path="knowledge-base" element={<EmployeeKnowledgeBase />} />
              <Route path="settings" element={<EmployeeSettings />} />
            </Route>

            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRole="client">
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/client/dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="create-ticket" element={<ClientCreateTicket />} />
              <Route path="my-tickets" element={<ClientMyTickets />} />
              <Route path="ticket-details" element={<ClientTicketDetails />} />
              <Route path="settings" element={<ClientSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

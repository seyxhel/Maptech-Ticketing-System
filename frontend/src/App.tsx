import React from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { PrivacyPolicy } from './pages/auth/PrivacyPolicy';
import { TermsOfService } from './pages/auth/TermsOfService';
import { NotFound } from './pages/auth/NotFound';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';

import SuperAdminDashboard from './pages/superadmin/dashboard';
import SuperAdminUsers from './pages/superadmin/users';
import SuperAdminReports from './pages/superadmin/reports';
import SuperAdminSettings from './pages/superadmin/settings';
import SuperAdminAuditLogs from './pages/superadmin/audit-logs';

import AdminDashboard from './pages/admin/dashboard';
import AdminTickets from './pages/admin/tickets';
import AdminEscalatedTickets from './pages/admin/escalated-tickets';
import AdminEscalation from './pages/admin/escalation';
import AdminReports from './pages/admin/reports';
import AdminCreateTicket from './pages/admin/create-ticket';
import AdminTicketDetails from './pages/admin/ticket-details';
import AdminSettings from './pages/admin/settings';
import AdminAuditLogs from './pages/admin/audit-logs';
import AdminCallLogs from './pages/admin/call-logs';
import AdminKnowledgeHub from './pages/admin/knowledge-hub';
import AdminTypesOfService from './pages/admin/types-of-service';
import AdminProducts from './pages/admin/products';
import AdminClients from './pages/admin/clients';
import AdminDeviceEquipment from './pages/admin/device-equipment';

import EmployeeDashboard from './pages/employee/dashboard';
import EmployeeMyTickets from './pages/employee/my-tickets';
import EmployeeTicketDetails from './pages/employee/ticket-details';
import EmployeeKnowledgeHub from './pages/employee/knowledge-base';
import EmployeeSettings from './pages/employee/settings';
import EmployeeEscalation from './pages/employee/escalation';



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
        <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
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
              <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
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
              <Route path="tickets/escalated" element={<AdminEscalatedTickets />} />
              <Route path="escalation" element={<AdminEscalation />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="create-ticket" element={<AdminCreateTicket />} />
              <Route path="ticket-details" element={<AdminTicketDetails />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="call-logs" element={<AdminCallLogs />} />
              <Route path="knowledge-hub" element={<Navigate to="/admin/knowledge-hub/uploaded" replace />} />
              <Route path="knowledge-hub/uploaded" element={<AdminKnowledgeHub filter="uploaded" />} />
              <Route path="knowledge-hub/published" element={<AdminKnowledgeHub filter="published" />} />
              <Route path="knowledge-hub/archived" element={<AdminKnowledgeHub filter="archived" />} />
              <Route path="types-of-service" element={<AdminTypesOfService />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="device-equipment" element={<AdminDeviceEquipment />} />
              <Route path="clients" element={<AdminClients />} />
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
              <Route path="escalation" element={<EmployeeEscalation />} />
              <Route path="knowledge-hub" element={<EmployeeKnowledgeHub />} />
              <Route path="settings" element={<EmployeeSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </>
  );
}

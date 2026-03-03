import React from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Signup } from './pages/Signup';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { NotFound } from './pages/NotFound';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { ClientLayout } from './layouts/ClientLayout';

import SuperAdminDashboard from './pages/superadmin/dashboard';
import SuperAdminUsers from './pages/superadmin/users';
import SuperAdminReports from './pages/superadmin/reports';
import SuperAdminSettings from './pages/superadmin/settings';
import SuperAdminAuditLogs from './pages/superadmin/audit-logs';

import AdminDashboard from './pages/admin/dashboard';
import AdminTickets from './pages/admin/tickets';
import AdminEscalation from './pages/admin/escalation';
import AdminReports from './pages/admin/reports';
import AdminCreateTicket from './pages/admin/create-ticket';
import AdminTicketDetails from './pages/admin/ticket-details';
import AdminSettings from './pages/admin/settings';
import AdminAuditLogs from './pages/admin/audit-logs';
import AdminKnowledgeHub from './pages/admin/knowledge-hub';
import AdminTypesOfService from './pages/admin/types-of-service';

import EmployeeDashboard from './pages/employee/dashboard';
import EmployeeMyTickets from './pages/employee/my-tickets';
import EmployeeTicketDetails from './pages/employee/ticket-details';
import EmployeeKnowledgeHub from './pages/employee/knowledge-base';
import EmployeeSettings from './pages/employee/settings';
import EmployeeEscalation from './pages/employee/escalation';

import ClientDashboard from './pages/client/dashboard';
import ClientMyTickets from './pages/client/my-tickets';
import ClientCreateTicket from './pages/client/create-ticket';
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
        <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />
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
              <Route path="escalation" element={<AdminEscalation />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="create-ticket" element={<AdminCreateTicket />} />
              <Route path="ticket-details" element={<AdminTicketDetails />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="knowledge-hub" element={<AdminKnowledgeHub />} />
              <Route path="types-of-service" element={<AdminTypesOfService />} />
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
              <Route path="my-tickets" element={<ClientMyTickets />} />
              <Route path="create-ticket" element={<ClientCreateTicket />} />
              <Route path="ticket-details" element={<ClientTicketDetails />} />
              <Route path="settings" element={<ClientSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </>
  );
}

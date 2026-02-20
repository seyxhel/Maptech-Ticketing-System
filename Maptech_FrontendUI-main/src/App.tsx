import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { TicketView } from './pages/TicketView';
import { CreateTicket } from './pages/CreateTicket';
import { Reports } from './pages/Reports';
import { UserManagement } from './pages/UserManagement';
type Role = 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';
export function App() {
  const [currentRole, setCurrentRole] = useState<Role>('SuperAdmin');
  const [currentPage, setCurrentPage] = useState<string>('superadmin-dashboard');
  const [isDark, setIsDark] = useState(false);
  // Sync dark class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  const handleNavigate = (page: string) => {
    if (page === 'logout') {
      setCurrentRole('SuperAdmin');
      setCurrentPage('superadmin-dashboard');
      return;
    }
    setCurrentPage(page);
  };
  const renderPage = () => {
    switch (currentPage) {
      case 'superadmin-dashboard':
        return <SuperAdminDashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'employee-dashboard':
        return <EmployeeDashboard onNavigate={handleNavigate} />;
      case 'client-dashboard':
        return <ClientDashboard />;
      case 'create-ticket':
        return <CreateTicket />;
      case 'reports':
        return <Reports />;
      case 'ticket-view':
        return <TicketView />;
      case 'user-management':
        return <UserManagement />;
      case 'admin-tickets':
      case 'employee-tickets':
      case 'client-tickets':
        if (currentRole === 'Client') return <ClientDashboard />;
        if (currentRole === 'Employee')
        return <EmployeeDashboard onNavigate={handleNavigate} />;
        if (currentRole === 'Admin') return <AdminDashboard />;
        return <AdminDashboard />;
      default:
        return <SuperAdminDashboard />;
    }
  };
  const RoleSwitcher = () =>
  <div className="fixed bottom-4 right-4 z-[60] bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
        Demo Role Switcher
      </div>
      {(['SuperAdmin', 'Admin', 'Employee', 'Client'] as Role[]).map((r) =>
    <button
      key={r}
      onClick={() => {
        setCurrentRole(r);
        setCurrentPage(`${r.toLowerCase()}-dashboard`);
      }}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-left ${currentRole === r ? 'bg-[#0E8F79] text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>

          {r}
        </button>
    )}
    </div>;

  return (
    <>
      <Toaster position="top-right" richColors />
      <Layout
        role={currentRole}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}>

        {renderPage()}
      </Layout>
      <RoleSwitcher />
    </>);

}
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import type { NavItem } from '../components/layout/Sidebar';
import { LayoutDashboard, FileText, Ticket } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/client/dashboard' },
  { id: 'create-ticket', label: 'Create Ticket', icon: FileText, path: '/client/create-ticket' },
  { id: 'my-tickets', label: 'My Tickets', icon: Ticket, path: '/client/my-tickets' },
];

export function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleNavigate = (path: string) => {
    if (path === 'logout') {
      logout();
      navigate('/login', { replace: true });
      return;
    }
    navigate(path);
  };

  if (!user) return null;

  return (
    <Layout
      role="Client"
      currentPage={location.pathname}
      onNavigate={handleNavigate}
      isDark={isDark}
      onToggleDark={() => setIsDark((d) => !d)}
      navItems={NAV_ITEMS}
    >
      <Outlet />
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import type { NavItem } from '../components/layout/Sidebar';
import { LayoutDashboard, Ticket, ShieldAlert, BarChart3 } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/admin/tickets' },
  { id: 'escalation', label: 'Escalation', icon: ShieldAlert, path: '/admin/escalation' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
];

export function AdminLayout() {
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
      role="Admin"
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

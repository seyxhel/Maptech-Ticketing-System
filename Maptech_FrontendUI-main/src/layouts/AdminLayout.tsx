import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Layout } from '../components/layout/Layout';
import type { NavItem } from '../components/layout/Sidebar';
import { LayoutDashboard, Ticket, ShieldAlert, BarChart3, PlusCircle, ScrollText, BookOpen, Settings2, Package, Users, Monitor } from 'lucide-react';
import { NetworkErrorModal, useNetworkStatus } from '../shared';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/admin/tickets' },
  { id: 'create-ticket', label: 'Create Ticket', icon: PlusCircle, path: '/admin/create-ticket' },
  { id: 'escalation', label: 'Escalation', icon: ShieldAlert, path: '/admin/escalation' },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText, path: '/admin/audit-logs' },
  { id: 'knowledge-hub', label: 'Knowledge Hub', icon: BookOpen, path: '/admin/knowledge-hub' },
  { id: 'device-equipment', label: 'Device/Equipment', icon: Monitor, path: '/admin/device-equipment' },
  { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
  { id: 'clients', label: 'Clients', icon: Users, path: '/admin/clients' },
  { id: 'types-of-service', label: 'Types of Service', icon: Settings2, path: '/admin/types-of-service' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    if (path === 'logout') {
      logout();
      navigate('/login', { replace: true });
      return;
    }
    navigate(path);
  };

  const { isOffline, retry, dismiss, retrying } = useNetworkStatus();

  if (!user) return null;

  return (
    <Layout
      role="Admin"
      currentPage={location.pathname}
      onNavigate={handleNavigate}
      isDark={isDark}
      onToggleDark={toggleDark}
      navItems={NAV_ITEMS}
    >
      <NetworkErrorModal isOpen={isOffline} onRetry={retry} onDismiss={dismiss} retrying={retrying} />
      <Outlet />
    </Layout>
  );
}

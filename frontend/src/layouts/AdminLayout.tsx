import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Layout } from '../components/layout/Layout';
import type { NavItem } from '../components/layout/Sidebar';
import { LayoutDashboard, Ticket, ShieldAlert, BarChart3, PlusCircle, ScrollText, BookOpen, Settings2, Package, Users, Monitor, Upload, FileCheck, Archive, Shield, PhoneCall } from 'lucide-react';
import { NetworkErrorModal, useNetworkStatus } from '../shared';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: Ticket,
    path: '/admin/tickets',
    children: [
      { id: 'all-tickets', label: 'All Tickets', icon: Ticket, path: '/admin/tickets', exact: true },
      { id: 'escalated-tickets', label: 'Escalated Tickets', icon: ShieldAlert, path: '/admin/tickets/escalated' },
    ],
  },
  { id: 'create-ticket', label: 'Create Ticket', icon: PlusCircle, path: '/admin/create-ticket' },
  {
    id: 'logs',
    label: 'Logs',
    icon: ScrollText,
    path: '/admin/logs',
    children: [
      { id: 'audit-logs', label: 'Audit Logs', icon: Shield, path: '/admin/audit-logs' },
      { id: 'call-logs', label: 'Call Logs', icon: PhoneCall, path: '/admin/call-logs' },
      { id: 'escalation', label: 'Escalation Logs', icon: ShieldAlert, path: '/admin/escalation' },
    ],
  },
  {
    id: 'knowledge-hub',
    label: 'Knowledge Hub',
    icon: BookOpen,
    path: '/admin/knowledge-hub',
    children: [
      { id: 'kh-uploaded', label: 'Uploaded Attachments', icon: Upload, path: '/admin/knowledge-hub/uploaded' },
      { id: 'kh-published', label: 'Published Attachments', icon: FileCheck, path: '/admin/knowledge-hub/published' },
      { id: 'kh-archived', label: 'Archived Attachments', icon: Archive, path: '/admin/knowledge-hub/archived' },
    ],
  },
  { id: 'device-equipment', label: 'Device/Equipment (Category)', icon: Monitor, path: '/admin/device-equipment' },
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

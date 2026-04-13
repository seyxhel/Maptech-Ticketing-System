import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Layout } from '../components/layout/Layout';
import { type NavItem } from '../components/layout/Sidebar';
import { LayoutDashboard, Users, BarChart3, Settings, ScrollText, Award, PhoneCall, ShieldAlert, Shield } from 'lucide-react';
import { NetworkErrorModal, useNetworkStatus } from '../shared';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
  { id: 'users', label: 'User Management', icon: Users, path: '/superadmin/users' },
  {
    id: 'logs',
    label: 'Logs',
    icon: ScrollText,
    path: '/superadmin/logs',
    children: [
      { id: 'audit-logs', label: 'Audit Logs', icon: Shield, path: '/superadmin/audit-logs' },
      { id: 'call-logs', label: 'Call Logs', icon: PhoneCall, path: '/superadmin/call-logs' },
      { id: 'escalation-logs', label: 'Escalation Logs', icon: ShieldAlert, path: '/superadmin/escalation-logs' },
    ],
  },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/superadmin/reports' },
  { id: 'technical-staff-ratings', label: 'Technical Staff Ratings', icon: Award, path: '/superadmin/technical-staff-ratings' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/superadmin/settings' },
];

export function SuperAdminLayout() {
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
  const layoutRole = 'SuperAdmin' as const;

  return (
    <Layout
      role={layoutRole}
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

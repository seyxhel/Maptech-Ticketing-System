import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import { Sidebar, type NavItem } from '../components/layout/Sidebar';
import { LayoutDashboard, Users, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
  { id: 'users', label: 'User Management', icon: Users, path: '/superadmin/users' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/superadmin/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/superadmin/settings' },
];

export function SuperAdminLayout() {
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
  const layoutRole = 'SuperAdmin' as const;

  return (
    <Layout
      role={layoutRole}
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

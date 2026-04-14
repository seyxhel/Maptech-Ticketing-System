import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Layout } from '../components/layout/Layout';
import type { NavItem } from '../components/layout/Sidebar';
import { Ticket, PlusCircle, Package, Users, Monitor, LayoutDashboard } from 'lucide-react';
import { NetworkErrorModal, useNetworkStatus } from '../shared';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/sales/dashboard' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/sales/tickets' },
  { id: 'create-ticket', label: 'Create Ticket', icon: PlusCircle, path: '/sales/create-ticket' },
  { id: 'clients', label: 'Clients', icon: Users, path: '/sales/clients' },
  { id: 'products', label: 'Products', icon: Package, path: '/sales/products' },
  { id: 'categories', label: 'Categories', icon: Monitor, path: '/sales/categories' },
];

export function SalesLayout() {
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
      role="Sales"
      currentPage={location.pathname}
      onNavigate={handleNavigate}
      isDark={isDark}
      onToggleDark={toggleDark}
      navItems={NAV_ITEMS}
      isFluid={location.pathname === '/sales/dashboard'}
    >
      <NetworkErrorModal isOpen={isOffline} onRetry={retry} onDismiss={dismiss} retrying={retrying} />
      <Outlet />
    </Layout>
  );
}
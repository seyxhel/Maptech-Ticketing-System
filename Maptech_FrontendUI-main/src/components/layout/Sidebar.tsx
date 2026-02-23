import React from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Ticket,
  ShieldAlert,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface SidebarProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';
  onNavigate: (page: string) => void;
  currentPage: string;
  /** When provided, use these items (path = route path). Otherwise derive from role (legacy). */
  navItems?: NavItem[];
}

export function Sidebar({ role, onNavigate, currentPage, navItems: navItemsProp }: SidebarProps) {
  const getNavItems = (): NavItem[] => {
    const common: NavItem[] = [
      { id: 'logout', label: 'Logout', icon: LogOut, path: 'logout' },
    ];
    switch (role) {
      case 'SuperAdmin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'superadmin-dashboard' },
          { id: 'user-management', label: 'User Management', icon: Users, path: 'user-management' },
          { id: 'reports', label: 'Global Reports', icon: BarChart3, path: 'reports' },
          { id: 'settings', label: 'Settings', icon: Settings, path: 'settings' },
          ...common,
        ];
      case 'Admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'admin-dashboard' },
          { id: 'tickets', label: 'Tickets', icon: Ticket, path: 'admin-tickets' },
          { id: 'escalation', label: 'Escalation', icon: ShieldAlert, path: 'escalation' },
          { id: 'reports', label: 'Reports', icon: BarChart3, path: 'reports' },
          ...common,
        ];
      case 'Employee':
        return [
          { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard, path: 'employee-dashboard' },
          { id: 'my-tickets', label: 'My Tickets', icon: Ticket, path: 'employee-my-tickets' },
          ...common,
        ];
      case 'Client':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'client-dashboard' },
          { id: 'create-ticket', label: 'Create Ticket', icon: FileText, path: 'create-ticket' },
          { id: 'my-tickets', label: 'My Tickets', icon: Ticket, path: 'client-my-tickets' },
          ...common,
        ];
      default:
        return common;
    }
  };

  const navItems = navItemsProp ?? getNavItems();
  const isPathMatch = (itemPath: string) =>
    itemPath === 'logout' ? false : (currentPage === itemPath || currentPage.startsWith(itemPath + '/'));

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-gray-800">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center">
        <img
          src="/Maptech%20Official%20Logo%20version2%20(1).png"
          alt="Maptech Logo"
          className="h-16 w-auto mb-2 object-contain" />

        <span className="text-xs text-gray-500 dark:text-gray-400 text-center tracking-wide font-medium leading-tight">
          Maptech Information Solutions Inc.
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = navItemsProp ? isPathMatch(item.path) : currentPage === item.path;
          const Icon = item.icon;
          if (item.id === 'logout') return null;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-lg shadow-[#3BC25B]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>

              <Icon
                className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />

              {item.label}
            </button>);

        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => onNavigate('logout')}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors">

          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>);

}
import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  ShieldAlert,
  Briefcase } from
'lucide-react';
interface SidebarProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';
  onNavigate: (page: string) => void;
  currentPage: string;
}
export function Sidebar({ role, onNavigate, currentPage }: SidebarProps) {
  const getNavItems = () => {
    const common = [
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      path: 'logout'
    }];

    switch (role) {
      case 'SuperAdmin':
        return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: 'superadmin-dashboard'
        },
        {
          id: 'user-management',
          label: 'User Management',
          icon: Users,
          path: 'user-management'
        },
        {
          id: 'reports',
          label: 'Global Reports',
          icon: BarChart3,
          path: 'reports'
        },
        ...common];

      case 'Admin':
        return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: 'admin-dashboard'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
          path: 'reports'
        },
        ...common];

      case 'Employee':
        return [
        {
          id: 'dashboard',
          label: 'My Dashboard',
          icon: LayoutDashboard,
          path: 'employee-dashboard'
        },
        ...common];

      case 'Client':
        return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: 'client-dashboard'
        },
        {
          id: 'create-ticket',
          label: 'Create Ticket',
          icon: FileText,
          path: 'create-ticket'
        },
        ...common];

      default:
        return common;
    }
  };
  const navItems = getNavItems();
  return (
    <aside className="w-64 bg-[#0a0a0a] text-white flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-gray-800">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-800 flex flex-col items-center">
        <img
          src="/428183554_374825961972306_8992615643305284211_n.jpg"
          alt="Maptech Logo"
          className="h-16 w-16 mb-2 object-cover rounded-lg" />

        <span className="text-xs text-gray-400 text-center tracking-wide font-medium leading-tight">
          Maptech Information Solutions Inc.
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.path;
          const Icon = item.icon;
          if (item.id === 'logout') return null;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-lg shadow-[#3BC25B]/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>

              <Icon
                className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />

              {item.label}
            </button>);

        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => onNavigate('logout')}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors">

          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>);

}
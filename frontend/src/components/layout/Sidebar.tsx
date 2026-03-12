import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Ticket,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { SignOutModal } from '../ui/SignOutModal';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  children?: NavItem[];
}

interface SidebarProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Technical' | 'Technical Staff' | 'Client';
  onNavigate: (page: string) => void;
  currentPage: string;
  /** When provided, use these items (path = route path). Otherwise derive from role (legacy). */
  navItems?: NavItem[];
  onExpandChange?: (isExpanded: boolean) => void;
}

export function Sidebar({ role, onNavigate, currentPage, navItems: navItemsProp, onExpandChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
    onExpandChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    onExpandChange?.(false);
  };

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
      case 'Technical Staff':
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
    <aside 
      className={`bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center">
        <img
          src="/Maptech%20Official%20Logo%20version2%20(1).png"
          alt="Maptech Logo"
          className="h-16 w-auto mb-2 object-contain" />

        {isExpanded && (
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center tracking-wide font-medium leading-tight">
            Maptech Information Solutions Inc.
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.id === 'logout') return null;
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isChildActive = hasChildren && item.children!.some((c) => isPathMatch(c.path));
          const isActive = navItemsProp ? (isPathMatch(item.path) || isChildActive) : currentPage === item.path;
          const isGroupOpen = expandedGroups.has(item.id) || isChildActive;

          if (hasChildren) {
            return (
              <div key={item.id}>
                <button
                  onClick={() => { if (isExpanded) toggleGroup(item.id); else onNavigate(item.children![0].path); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isExpanded ? '' : 'justify-center'} ${isActive ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-lg shadow-[#3BC25B]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                  {isExpanded && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {isExpanded && isGroupOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children!.map((child) => {
                      const childActive = isPathMatch(child.path);
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.id}
                          onClick={() => onNavigate(child.path)}
                          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 group ${childActive ? 'bg-[#3BC25B]/15 text-[#0E8F79] dark:text-[#63D44A] font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                          <ChildIcon className={`w-4 h-4 flex-shrink-0 mr-3 ${childActive ? 'text-[#0E8F79] dark:text-[#63D44A]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isExpanded ? '' : 'justify-center'} ${isActive ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-lg shadow-[#3BC25B]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />

              {isExpanded && item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowSignOutModal(true)}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors ${isExpanded ? '' : 'justify-center'}`}
          title={!isExpanded ? 'Sign Out' : undefined}
        >
          <LogOut className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'mr-3' : ''}`} />
          {isExpanded && 'Sign Out'}
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onConfirm={() => {
          setShowSignOutModal(false);
          onNavigate('logout');
        }}
        onCancel={() => setShowSignOutModal(false)}
      />
    </aside>
  );
}
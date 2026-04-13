import React, { useEffect, useState } from 'react';
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
  X,
} from 'lucide-react';
import { SignOutModal } from '../ui/SignOutModal';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  exact?: boolean;
  children?: NavItem[];
}

interface SidebarProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Technical' | 'Technical Staff' | 'Client' | 'Sales';
  onNavigate: (page: string) => void;
  currentPage: string;
  /** When provided, use these items (path = route path). Otherwise derive from role (legacy). */
  navItems?: NavItem[];
  onExpandChange?: (isExpanded: boolean) => void;
  isMobileOpen?: boolean;
  onNavigateItem?: () => void;
}

export function Sidebar({
  role,
  onNavigate,
  currentPage,
  navItems: navItemsProp,
  onExpandChange,
  isMobileOpen = false,
  onNavigateItem,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktopViewport(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarExpanded = !isDesktopViewport || isMobileOpen || isExpanded;

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleMouseEnter = () => {
    if (isMobileOpen) return;
    setIsExpanded(true);
    onExpandChange?.(true);
  };

  const handleMouseLeave = () => {
    if (isMobileOpen) return;
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
          { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard, path: 'technical-staff-dashboard' },
          { id: 'my-tickets', label: 'My Tickets', icon: Ticket, path: 'technical-staff-my-tickets' },
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
  const isPathMatch = (item: NavItem) => {
    if (item.path === 'logout') return false;
    if (item.exact) return currentPage === item.path;
    return currentPage === item.path || currentPage.startsWith(item.path + '/');
  };

  return (
    <aside 
      className={`bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col h-full border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarExpanded ? 'w-[85vw] max-w-72 lg:w-64' : 'w-20'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Area */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center relative">
        {isMobileOpen && (
          <button
            onClick={onNavigateItem}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <img
          src="/Maptech%20Official%20Logo%20version2%20(1).png"
          alt="Maptech Logo"
          className="h-16 w-auto mb-2 object-contain" />

        {sidebarExpanded && (
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
          const childItems = item.children ?? [];
          const hasChildren = childItems.length > 0;
          const isChildActive = hasChildren && childItems.some((c) => isPathMatch(c));
          const isActive = navItemsProp ? (isPathMatch(item) || isChildActive) : currentPage === item.path;
          const isGroupOpen = expandedGroups.has(item.id) || isChildActive;

          if (hasChildren) {
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (sidebarExpanded) {
                      toggleGroup(item.id);
                    } else if (childItems[0]) {
                      onNavigate(childItems[0].path);
                    }
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${sidebarExpanded ? '' : 'justify-center'} ${isActive ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-lg shadow-[#3BC25B]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarExpanded ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                  {sidebarExpanded && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {sidebarExpanded && isGroupOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {childItems.map((child) => {
                      const childActive = isPathMatch(child);
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.id}
                          onClick={() => {
                            onNavigate(child.path);
                            onNavigateItem?.();
                          }}
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
              onClick={() => {
                onNavigate(item.path);
                onNavigateItem?.();
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${sidebarExpanded ? '' : 'justify-center'} ${isActive ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-lg shadow-[#3BC25B]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
              title={!sidebarExpanded ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${sidebarExpanded ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />

              {sidebarExpanded && item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowSignOutModal(true)}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors ${sidebarExpanded ? '' : 'justify-center'}`}
          title={!sidebarExpanded ? 'Sign Out' : undefined}
        >
          <LogOut className={`w-5 h-5 flex-shrink-0 ${sidebarExpanded ? 'mr-3' : ''}`} />
          {sidebarExpanded && 'Sign Out'}
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onConfirm={() => {
          setShowSignOutModal(false);
          onNavigate('logout');
          onNavigateItem?.();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />
    </aside>
  );
}
import React, { useState } from 'react';
import { Bell, Sun, Moon, Menu, Settings } from 'lucide-react';
import { NotificationPanel, INITIAL_NOTIFICATIONS } from '../NotificationPanel';
import type { NotificationItem } from '../NotificationPanel';

interface TopNavUser {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  username?: string;
  email?: string;
  name?: string;
  role?: string;
}

interface TopNavProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';
  isDark: boolean;
  onToggleDark: () => void;
  onMenuClick?: () => void;
  onNavigate?: (path: string) => void;
  user?: TopNavUser | null;
}
const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Administrator',
  Admin: 'Administrator',
  Employee: 'Employee',
  Client: 'Client Portal',
  // Also support lowercase backend role values
  superadmin: 'Super Administrator',
  admin: 'Administrator',
  employee: 'Employee',
};

function getRoleLabel(user?: TopNavUser | null, layoutRole?: string): string {
  // Prefer the actual user's role from the auth context
  if (user?.role) {
    return ROLE_LABELS[user.role] || user.role;
  }
  // Fallback to the layout-level role prop
  return ROLE_LABELS[layoutRole || ''] || layoutRole || '';
}

function getDisplayName(user?: TopNavUser | null, role?: string): string {
  if (user) {
    const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (full) return full;
    if (user.name) return user.name;
    if (user.username) return user.username;
  }
  return role || 'User';
}

function getInitials(user?: TopNavUser | null, role?: string): string {
  if (user) {
    const first = (user.first_name || '')[0];
    const last = (user.last_name || '')[0];
    if (first && last) return (first + last).toUpperCase();
    if (user.name) {
      const parts = user.name.split(' ').filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      if (parts.length === 1) return parts[0][0].toUpperCase();
    }
    if (user.username) return user.username[0].toUpperCase();
  }
  return (role || 'U')[0].toUpperCase();
}
export function TopNav({
  role,
  isDark,
  onToggleDark,
  onMenuClick,
  onNavigate,
  user: authUser
}: TopNavProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 fixed top-0 right-0 left-0 lg:left-64 z-40 px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
      {/* Left: hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">

          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: dark toggle, notifications, user */}
      <div className="flex items-center gap-2">
        {/* Dark / Light toggle */}
        <button
          onClick={onToggleDark}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">

          {isDark ?
          <Sun className="w-5 h-5 text-yellow-400" /> :

          <Moon className="w-5 h-5" />
          }
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen((o) => !o)}
            className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {badgeLabel && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-900 leading-none">
                {badgeLabel}
              </span>
            )}
          </button>
          <NotificationPanel
            isOpen={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            role={role}
            notifications={notifications}
            onNotificationsChange={setNotifications}
          />
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700 ml-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {getDisplayName(authUser, role)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {getRoleLabel(authUser, role)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#63D44A] to-[#0E8F79] flex items-center justify-center text-white text-xs font-bold">
              {getInitials(authUser, role)}
            </div>
            <button
              onClick={() => onNavigate?.(`/${role.toLowerCase()}/settings`)}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
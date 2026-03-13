import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Sun, Moon, Menu, Settings } from 'lucide-react';
import { NotificationPanel, backendToNotificationItem } from '../NotificationPanel';
import type { NotificationItem } from '../NotificationPanel';
import { NotificationSocket } from '../../services/notificationService';
import type { NotificationEvent } from '../../services/notificationService';
import {
  fetchNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications,
} from '../../services/api';

interface TopNavUser {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  username?: string;
  email?: string;
  name?: string;
  role?: string;
  profile_picture_url?: string | null;
}

interface TopNavProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Technical' | 'Technical Staff' | 'Client';
  isDark: boolean;
  onToggleDark: () => void;
  onMenuClick?: () => void;
  onNavigate?: (path: string) => void;
  user?: TopNavUser | null;
  isSidebarExpanded?: boolean;
}
const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Administrator',
  Admin: 'Supervisor',
  Employee: 'Technical',
  Client: 'Client Portal',
  // Also support lowercase backend role values
  superadmin: 'Super Administrator',
  admin: 'Supervisor',
  employee: 'Technical',
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
  user: authUser,
  isSidebarExpanded = false
}: TopNavProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const socketRef = useRef<NotificationSocket | null>(null);

  // ── Load notifications from REST on mount ──
  useEffect(() => {
    let cancelled = false;
    fetchNotifications()
      .then((data) => {
        if (!cancelled) {
          setNotifications(data.map(backendToNotificationItem));
        }
      })
      .catch(() => { /* silently ignore if backend not reachable */ });
    return () => { cancelled = true; };
  }, []);

  // ── WebSocket for real-time push ──
  useEffect(() => {
    const sock = new NotificationSocket({
      onEvent: (event: NotificationEvent) => {
        if (event.type === 'new_notification') {
          const item = backendToNotificationItem(event.notification);
          setNotifications((prev) => [item, ...prev]);
        }
        // unread_count events are informational; we derive count from local state
      },
    });
    socketRef.current = sock;
    return () => { sock.disconnect(); };
  }, []);

  // ── Handlers that call the backend API ──
  const handleMarkRead = useCallback(async (ids: number[]) => {
    setNotifications((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, is_read: true } : n));
    try { await markNotificationsRead(ids); } catch { /* revert on error if desired */ }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try { await markAllNotificationsRead(); } catch { /* ignore */ }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await apiDeleteNotification(id); } catch { /* ignore */ }
  }, []);

  const handleClearAll = useCallback(async () => {
    setNotifications([]);
    try { await clearAllNotifications(); } catch { /* ignore */ }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;
  const goToSettings = () => {
    const rolePathMap: Record<string, string> = { 'Technical Staff': 'employee', SuperAdmin: 'superadmin', Admin: 'admin', Employee: 'employee', Client: 'client' };
    const segment = rolePathMap[role] || role.toLowerCase();
    onNavigate?.(`/${segment}/settings`);
  };

  return (
    <>
    <header className={`h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 fixed top-0 right-0 left-0 ${isSidebarExpanded ? 'lg:left-64' : 'lg:left-20'} z-40 px-3 sm:px-4 lg:px-6 flex items-center justify-between shadow-sm transition-all duration-300`}>
      {/* Left: hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">

          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: dark toggle, notifications, user */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onDelete={handleDelete}
            onClearAll={handleClearAll}
          />
        </div>

        {/* User info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700 ml-1 min-w-0">
          <div className="text-right hidden lg:block min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {getDisplayName(authUser, role)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {getRoleLabel(authUser, role)}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={goToSettings}
              className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#63D44A] to-[#0E8F79] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative hover:opacity-90"
              title="Profile settings"
              aria-label="Profile settings"
            >
              {getInitials(authUser, role)}
              {authUser?.profile_picture_url && (
                <img
                  key={authUser.profile_picture_url}
                  src={authUser.profile_picture_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </button>
            <button
              onClick={goToSettings}
              className="inline-flex p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
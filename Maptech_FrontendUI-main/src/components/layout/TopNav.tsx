import React, { useState } from 'react';
import { Bell, Search, Sun, Moon, Menu, Settings } from 'lucide-react';
import { NotificationPanel } from '../NotificationPanel';

interface TopNavProps {
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';
  isDark: boolean;
  onToggleDark: () => void;
  onMenuClick?: () => void;
  onNavigate?: (path: string) => void;
}
const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Administrator',
  Admin: 'Administrator',
  Employee: 'Support Engineer',
  Client: 'Client Portal'
};
const ROLE_NAMES: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  Admin: 'Alex Admin',
  Employee: 'Sarah Engineer',
  Client: 'John Client'
};
const ROLE_EMAILS: Record<string, string> = {
  SuperAdmin: 'superadmin@maptech.com',
  Admin: 'alex@maptech.com',
  Employee: 'sarah@maptech.com',
  Client: 'john@client.com'
};
const ROLE_INITIALS: Record<string, string> = {
  SuperAdmin: 'SA',
  Admin: 'AA',
  Employee: 'SE',
  Client: 'JC'
};
export function TopNav({
  role,
  isDark,
  onToggleDark,
  onMenuClick,
  onNavigate
}: TopNavProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <>
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 fixed top-0 right-0 left-0 lg:left-64 z-40 px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">

          <Menu className="w-5 h-5" />
        </button>

        {role !== 'Client' && (
        <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-lg px-3 py-2 w-72 transition-colors">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tickets, users..."
            className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" />

        </div>
        )}
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
        <button
          onClick={() => setNotificationOpen(true)}
          className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        </button>
        <NotificationPanel
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          role={role}
        />

        {/* User info */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700 ml-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {ROLE_NAMES[role]}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {ROLE_LABELS[role]}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#63D44A] to-[#0E8F79] flex items-center justify-center text-white text-xs font-bold">
              {ROLE_INITIALS[role]}
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
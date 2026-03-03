import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Ticket,
  ArrowUpRight,
  CheckCircle,
  Check,
  AlertTriangle,
  FileText,
  Trash2,
  Mail,
  MailOpen,
  BellOff,
} from 'lucide-react';

type Role = 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';

export interface NotificationItem {
  id: string;
  type: 'assignment' | 'escalation' | 'approval' | 'resolution' | 'sla_warning' | 'new_client_ticket';
  title: string;
  ticketId?: string;
  time: string;
  read: boolean;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'assignment',        title: 'Ticket Assignment',       ticketId: 'STF-MT-20260223000012', time: '2m ago',  read: false },
  { id: '2', type: 'escalation',        title: 'Ticket Escalation',       ticketId: 'STF-MT-20260223000015', time: '15m ago', read: false },
  { id: '3', type: 'approval',          title: 'Ticket Approval',         ticketId: 'STF-MT-20260223000018', time: '1h ago',  read: false },
  { id: '4', type: 'resolution',        title: 'Resolution Confirmation', ticketId: 'STF-MT-20260223000012', time: '2h ago',  read: true  },
  { id: '5', type: 'sla_warning',       title: 'SLA Warning',             ticketId: 'STF-MT-20260223000015', time: '30m ago', read: true  },
  { id: '6', type: 'new_client_ticket', title: 'New Client Ticket',       ticketId: 'STF-MT-20260223000020', time: '5m ago',  read: false },
];

function getNotificationPath(role: Role, type: NotificationItem['type']): string {
  switch (role) {
    case 'Admin':
      switch (type) {
        case 'escalation':        return '/admin/escalation';
        case 'new_client_ticket': return '/admin/tickets';
        default:                  return '/admin/ticket-details';
      }
    case 'Employee':
      return '/employee/ticket-details';
    case 'Client':
      return '/client/ticket-details';
    case 'SuperAdmin':
      switch (type) {
        case 'escalation': return '/superadmin/dashboard';
        default:           return '/superadmin/dashboard';
      }
    default:
      return '/';
  }
}

function getIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'assignment':        return Ticket;
    case 'escalation':        return ArrowUpRight;
    case 'approval':          return Check;
    case 'resolution':        return CheckCircle;
    case 'sla_warning':       return AlertTriangle;
    case 'new_client_ticket': return FileText;
    default:                  return Bell;
  }
}

type FilterTab = 'all' | 'unread';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  notifications: NotificationItem[];
  onNotificationsChange: (notifications: NotificationItem[]) => void;
}

export function NotificationPanel({ isOpen, onClose, role, notifications, onNotificationsChange }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayedNotifications = activeTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleClick = (item: NotificationItem) => {
    onNotificationsChange(notifications.map((n) => n.id === item.id ? { ...n, read: true } : n));
    onClose();
    const path = getNotificationPath(role, item.type);
    navigate(path, item.ticketId ? { state: { ticketId: item.ticketId } } : undefined);
  };

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNotificationsChange(notifications.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    onNotificationsChange(notifications.map((n) => n.id === item.id ? { ...n, read: !n.read } : n));
  };

  const deleteNotification = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    onNotificationsChange(notifications.filter((n) => n.id !== itemId));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNotificationsChange([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dropdown below bell */}
      <div
        className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col max-h-[70vh] overflow-hidden z-50"
        role="dialog"
        aria-label="Notifications"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0E8F79]" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#0E8F79] hover:underline font-medium"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:underline font-medium"
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Tabs: All / Unread */}
          <div className="flex px-4 gap-1 pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#0E8F79] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === 'unread'
                  ? 'bg-[#0E8F79] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <BellOff className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {activeTab === 'unread' ? 'You\'re all caught up!' : 'When you get notifications, they\'ll show up here.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <div
                  key={item.id}
                  className={`group relative flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer ${
                    item.read
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  onClick={() => handleClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(item); } }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#0E8F79]/10 dark:bg-[#0E8F79]/20 flex items-center justify-center mt-0.5">
                    <Icon className="w-4 h-4 text-[#0E8F79]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${item.read ? 'font-normal text-gray-600 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                      {item.title}
                    </p>
                    {item.ticketId && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">{item.ticketId}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.time}</p>
                  </div>

                  {/* Action buttons — visible on hover */}
                  <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Toggle read/unread */}
                    <button
                      onClick={(e) => toggleRead(e, item)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-[#0E8F79] hover:bg-[#0E8F79]/10 transition-colors"
                      title={item.read ? 'Mark as unread' : 'Mark as read'}
                    >
                      {item.read
                        ? <Mail className="w-3.5 h-3.5" />
                        : <MailOpen className="w-3.5 h-3.5" />
                      }
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => deleteNotification(e, item.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Read/Unread dot (visible when actions are hidden) */}
                  <div className="flex-shrink-0 mt-2 group-hover:hidden">
                    {item.read
                      ? <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" title="Read" />
                      : <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" title="Unread" />
                    }
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

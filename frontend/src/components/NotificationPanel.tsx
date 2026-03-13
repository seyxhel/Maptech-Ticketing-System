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
  MailOpen,
  BellOff,
  MessageSquare,
  Info,
} from 'lucide-react';

type Role = 'SuperAdmin' | 'Admin' | 'Employee' | 'Technical' | 'Technical Staff' | 'Client';

export type NotificationType =
  | 'assignment'
  | 'escalation'
  | 'status_change'
  | 'new_ticket'
  | 'sla_warning'
  | 'closure'
  | 'message'
  | 'general';

export interface NotificationItem {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  ticket_id: number | null;
  ticket_stf_no: string | null;
  is_read: boolean;
  created_at: string;
}

/** Convert backend notification shape to our panel shape. */
export function backendToNotificationItem(raw: {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  ticket?: number | null;
  ticket_id?: number | null;
  ticket_stf_no?: string | null;
  is_read: boolean;
  created_at: string;
}): NotificationItem {
  return {
    id: raw.id,
    notification_type: raw.notification_type as NotificationType,
    title: raw.title,
    message: raw.message,
    ticket_id: raw.ticket_id ?? raw.ticket ?? null,
    ticket_stf_no: raw.ticket_stf_no ?? null,
    is_read: raw.is_read,
    created_at: raw.created_at,
  };
}

function getNotificationPath(role: Role, type: NotificationType): string {
  switch (role) {
    case 'Admin':
      switch (type) {
        case 'escalation':  return '/admin/escalation';
        case 'new_ticket':  return '/admin/tickets';
        default:            return '/admin/ticket-details';
      }
    case 'Employee':
    case 'Technical':
    case 'Technical Staff':
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

function getIcon(type: NotificationType) {
  switch (type) {
    case 'assignment':     return Ticket;
    case 'escalation':     return ArrowUpRight;
    case 'status_change':  return CheckCircle;
    case 'new_ticket':     return FileText;
    case 'sla_warning':    return AlertTriangle;
    case 'closure':        return Check;
    case 'message':        return MessageSquare;
    case 'general':        return Info;
    default:               return Bell;
  }
}

function formatTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

type FilterTab = 'all' | 'unread';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  notifications: NotificationItem[];
  onMarkRead: (ids: number[]) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
}

export function NotificationPanel({
  isOpen, onClose, role, notifications,
  onMarkRead, onMarkAllRead, onDelete, onClearAll,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayedNotifications = activeTab === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const handleClick = (item: NotificationItem) => {
    if (!item.is_read) onMarkRead([item.id]);
    onClose();
    const path = getNotificationPath(role, item.notification_type);
    navigate(path, item.ticket_stf_no ? { state: { ticketId: item.ticket_stf_no } } : undefined);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAllRead();
  };

  const toggleRead = (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    onMarkRead([item.id]);
  };

  const handleDeleteNotification = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    onDelete(itemId);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearAll();
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
        className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-[24rem] sm:w-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col max-h-[70vh] overflow-hidden z-50"
        role="dialog"
        aria-label="Notifications"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0E8F79]" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#0E8F79] hover:underline font-medium"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:underline font-medium"
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Tabs: All / Unread */}
          <div className="flex px-3 sm:px-4 gap-1 pb-2 overflow-x-auto">
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
              const Icon = getIcon(item.notification_type);
              return (
                <div
                  key={item.id}
                  className={`group relative flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer ${
                    item.is_read
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
                    <p className={`text-sm leading-tight ${item.is_read ? 'font-normal text-gray-600 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                      {item.title}
                    </p>
                    {item.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.message}</p>
                    )}
                    {item.ticket_stf_no && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">{item.ticket_stf_no}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatTimeAgo(item.created_at)}</p>
                  </div>

                  {/* Action buttons — visible on hover */}
                  <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Toggle read */}
                    {!item.is_read && (
                      <button
                        onClick={(e) => toggleRead(e, item)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#0E8F79] hover:bg-[#0E8F79]/10 transition-colors"
                        title="Mark as read"
                      >
                        <MailOpen className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, item.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Read/Unread dot (visible when actions are hidden) */}
                  <div className="flex-shrink-0 mt-2 group-hover:hidden">
                    {item.is_read
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

/**
 * notificationService.ts – WebSocket-based real-time notifications.
 *
 * Connects to the Django Channels backend at:
 *   ws://<host>:<port>/ws/notifications/
 *
 * Automatically reconnects with exponential back-off when the connection drops.
 */


// ── Types ──────────────────────────────────────────────

export interface BackendNotification {
  id: number;
  notification_type: 'assignment' | 'escalation' | 'status_change' | 'new_ticket' | 'sla_warning' | 'closure' | 'message' | 'general';
  title: string;
  message: string;
  ticket_id: number | null;
  ticket_stf_no: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationEvent =
  | { type: 'new_notification'; notification: BackendNotification }
  | { type: 'unread_count'; count: number };

type NotificationCallbacks = {
  onEvent: (event: NotificationEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
};

// ── Helpers ────────────────────────────────────────────

function getWsBaseUrl(): string {
  const explicitWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicitWsUrl && /^wss?:\/\//.test(explicitWsUrl)) {
    return explicitWsUrl.replace(/\/$/, '');
  }

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl && /^https?:\/\//.test(apiUrl)) {
    const parsed = new URL(apiUrl);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const port = (import.meta.env.VITE_WS_PORT as string | undefined) || (isLocal ? '8000' : '');
  return `${protocol}://${host}${port ? `:${port}` : ''}`;
}

function getAccessToken(): string | null {
  return localStorage.getItem('maptech_access') || sessionStorage.getItem('maptech_access') || null;
}

// ── Socket class ───────────────────────────────────────

export class NotificationSocket {
  private ws: WebSocket | null = null;
  private callbacks: NotificationCallbacks;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private shouldReconnect = true;
  private reconnectDelay = 1000;

  constructor(callbacks: NotificationCallbacks) {
    this.callbacks = callbacks;
    this.connect();
  }

  private connect() {
    const token = getAccessToken();
    const base = getWsBaseUrl();
    const url = `${base}/ws/notifications/${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.callbacks.onOpen?.();
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.callbacks.onEvent(data as NotificationEvent);
      } catch {
        /* ignore malformed frames */
      }
    };

    this.ws.onclose = () => {
      this.callbacks.onClose?.();
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 15_000);
          this.connect();
        }, this.reconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      this.callbacks.onError?.(err);
    };
  }

  /** Tell the server to mark specific notifications as read. */
  markRead(notificationIds: number[]) {
    if (this.ws?.readyState === WebSocket.OPEN && notificationIds.length > 0) {
      this.ws.send(JSON.stringify({ action: 'mark_read', notification_ids: notificationIds }));
    }
  }

  /** Tell the server to mark all notifications as read. */
  markAllRead() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'mark_all_read' }));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

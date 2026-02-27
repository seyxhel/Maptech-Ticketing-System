/**
 * chatService.ts – WebSocket-based chat for Admin ↔ Employee ticket messaging.
 *
 * Connects to the Django Channels backend at:
 *   ws://<host>:<port>/ws/chat/<ticketId>/admin_employee/?token=<jwt>
 *
 * Automatically reconnects with exponential back-off when the connection drops.
 */

// ── Types ──────────────────────────────────────────────

export type ChatAttachment = {
  id?: number;
  file_name: string;
  file_url: string;
  file_type: string; // 'image' | 'video' | 'file'
  file_size?: number;
  thumbnail_url?: string;
};

export type ChatMessage = {
  id: number | null;
  sender_id: number;
  sender_username: string;
  sender_role: string;
  content: string;
  attachments?: ChatAttachment[];
  reply_to: {
    id: number;
    content: string;
    sender_id: number;
    sender_username: string;
  } | null;
  is_system_message: boolean;
  reactions: Record<string, { user_id: number; username: string }[]>;
  read_by: { user_id: number; username: string; read_at: string }[];
  created_at: string;
};

export type TypingEvent = {
  user_id: number;
  username: string;
  is_typing: boolean;
};

export type ChatEvent =
  | { type: 'message_history'; messages: ChatMessage[] }
  | { type: 'new_message'; message: ChatMessage }
  | { type: 'typing'; user_id: number; username: string; is_typing: boolean }
  | {
      type: 'reaction_update';
      data: {
        message_id: number;
        reactions: { id: number; emoji: string; user_id: number; username: string }[];
      };
    }
  | {
      type: 'read_receipt';
      data: { message_id: number; user_id: number; username: string; read_at: string }[];
    }
  | { type: 'force_disconnect'; reason: string };

type ChatCallbacks = {
  onEvent: (event: ChatEvent) => void;
  onOpen?: () => void;
  onClose?: (reason?: string) => void;
  onError?: (err: Event) => void;
};

// ── Helpers ────────────────────────────────────────────

/** Read the JWT access token stored by AuthContext. */
function getAccessToken(): string | null {
  const TOKEN_KEY = 'maptech_access';
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

// ── Socket class ───────────────────────────────────────

export class TicketChatSocket {
  private ws: WebSocket | null = null;
  private ticketId: number;
  private channelType: string;
  private callbacks: ChatCallbacks;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private shouldReconnect = true;
  private reconnectDelay = 1000;

  constructor(
    ticketId: number,
    channelType: 'admin_employee',
    callbacks: ChatCallbacks,
  ) {
    this.ticketId = ticketId;
    this.channelType = channelType;
    this.callbacks = callbacks;
    this.connect();
  }

  private connect() {
    const token = getAccessToken();
    if (!token) {
      console.warn('[TicketChatSocket] No access token found – cannot connect.');
      this.callbacks.onError?.(new Event('no_token'));
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = import.meta.env.VITE_WS_PORT || '8000';
    const url = `${protocol}://${host}:${port}/ws/chat/${this.ticketId}/${this.channelType}/?token=${token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.callbacks.onOpen?.();
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.callbacks.onEvent(data as ChatEvent);
      } catch {
        /* ignore malformed frames */
      }
    };

    this.ws.onclose = (e) => {
      this.callbacks.onClose?.(e.reason || undefined);
      if (this.shouldReconnect && e.code !== 4001) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10_000);
          this.connect();
        }, this.reconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      this.callbacks.onError?.(err);
    };
  }

  // ── Outbound actions ──

  send(action: string, payload: Record<string, unknown> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    }
  }

  sendMessage(content: string, replyTo?: number) {
    this.send('send_message', { content, reply_to: replyTo ?? null });
  }

  sendAttachment(file: File, content?: string) {
    // For attachment uploads we use a REST endpoint because WebSocket
    // doesn't handle binary file uploads well. Fallback to base64 over WS
    // if REST isn't available.
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.send('send_message', {
        content: content || '',
        attachment: {
          file_name: file.name,
          file_data: base64,
          file_type: file.type,
          file_size: file.size,
        },
      });
    };
    reader.readAsDataURL(file);
  }

  sendTyping(isTyping: boolean) {
    this.send('typing', { is_typing: isTyping });
  }

  react(messageId: number, emoji: string) {
    this.send('react', { message_id: messageId, emoji });
  }

  markRead(messageIds: number[]) {
    if (messageIds.length > 0) {
      this.send('mark_read', { message_ids: messageIds });
    }
  }

  // ── Lifecycle ──

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

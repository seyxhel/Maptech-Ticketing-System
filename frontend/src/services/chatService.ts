import { getCookie } from '../utils/auth'

export type ChatMessage = {
  id: number | null
  sender_id: number
  sender_username: string
  sender_role: string
  content: string
  reply_to: {
    id: number
    content: string
    sender_id: number
    sender_username: string
  } | null
  is_system_message: boolean
  reactions: Record<string, { user_id: number; username: string }[]>
  read_by: { user_id: number; username: string; read_at: string }[]
  created_at: string
}

export type TypingEvent = {
  user_id: number
  username: string
  is_typing: boolean
}

export type ChatEvent =
  | { type: 'message_history'; messages: ChatMessage[] }
  | { type: 'new_message'; message: ChatMessage }
  | { type: 'typing'; user_id: number; username: string; is_typing: boolean }
  | { type: 'reaction_update'; data: { message_id: number; reactions: { id: number; emoji: string; user_id: number; username: string }[] } }
  | { type: 'read_receipt'; data: { message_id: number; user_id: number; username: string; read_at: string }[] }
  | { type: 'force_disconnect'; reason: string }

type ChatCallbacks = {
  onEvent: (event: ChatEvent) => void
  onOpen?: () => void
  onClose?: (reason?: string) => void
  onError?: (err: Event) => void
}

export class TicketChatSocket {
  private ws: WebSocket | null = null
  private ticketId: number
  private channelType: string
  private callbacks: ChatCallbacks
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private shouldReconnect = true
  private reconnectDelay = 1000

  constructor(ticketId: number, channelType: 'client_employee' | 'admin_employee', callbacks: ChatCallbacks) {
    this.ticketId = ticketId
    this.channelType = channelType
    this.callbacks = callbacks
    this.connect()
  }

  private connect() {
    const token = getCookie('access')
    if (!token) {
      this.callbacks.onError?.(new Event('no_token'))
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.hostname
    // In development the Django ASGI server runs on port 8000
    const port = import.meta.env.VITE_WS_PORT || '8000'
    const url = `${protocol}://${host}:${port}/ws/chat/${this.ticketId}/${this.channelType}/?token=${token}`

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
      this.callbacks.onOpen?.()
    }

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        this.callbacks.onEvent(data as ChatEvent)
      } catch { /* ignore malformed */ }
    }

    this.ws.onclose = (e) => {
      this.callbacks.onClose?.(e.reason || undefined)
      if (this.shouldReconnect && e.code !== 4001) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000)
          this.connect()
        }, this.reconnectDelay)
      }
    }

    this.ws.onerror = (err) => {
      this.callbacks.onError?.(err)
    }
  }

  send(action: string, payload: Record<string, any> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }))
    }
  }

  sendMessage(content: string, replyTo?: number) {
    this.send('send_message', { content, reply_to: replyTo || null })
  }

  sendTyping(isTyping: boolean) {
    this.send('typing', { is_typing: isTyping })
  }

  react(messageId: number, emoji: string) {
    this.send('react', { message_id: messageId, emoji })
  }

  markRead(messageIds: number[]) {
    if (messageIds.length > 0) {
      this.send('mark_read', { message_ids: messageIds })
    }
  }

  disconnect() {
    this.shouldReconnect = false
    clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

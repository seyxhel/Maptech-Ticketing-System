import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TicketChatSocket, ChatMessage, ChatEvent } from '../../services/chatService'

// ── Emoji picker (minimal built-in) ──
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👎']

interface TicketChatProps {
  ticketId: number
  channelType: 'client_employee' | 'admin_employee'
  currentUserId: number
  currentUserRole: string
}

export default function TicketChat({ ticketId, channelType, currentUserId, currentUserRole }: TicketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({})
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null)
  const [forcedReason, setForcedReason] = useState<string | null>(null)

  const socketRef = useRef<TicketChatSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // WebSocket connection
  useEffect(() => {
    setMessages([])
    setForcedReason(null)

    const sock = new TicketChatSocket(ticketId, channelType, {
      onEvent: (event: ChatEvent) => {
        switch (event.type) {
          case 'message_history':
            setMessages(event.messages)
            break
          case 'new_message':
            setMessages((prev) => [...prev, event.message])
            // Mark as read
            if (event.message.id && event.message.sender_id !== currentUserId) {
              sock.markRead([event.message.id])
            }
            break
          case 'typing':
            setTypingUsers((prev) => {
              const next = { ...prev }
              if (event.is_typing) {
                next[event.user_id] = event.username
              } else {
                delete next[event.user_id]
              }
              return next
            })
            break
          case 'reaction_update': {
            const { message_id, reactions } = event.data
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== message_id) return m
                const grouped: Record<string, { user_id: number; username: string }[]> = {}
                reactions.forEach((r: any) => {
                  if (!grouped[r.emoji]) grouped[r.emoji] = []
                  grouped[r.emoji].push({ user_id: r.user_id, username: r.username })
                })
                return { ...m, reactions: grouped }
              })
            )
            break
          }
          case 'read_receipt': {
            const receipts = event.data
            setMessages((prev) =>
              prev.map((m) => {
                const matching = receipts.filter((r: any) => r.message_id === m.id)
                if (matching.length === 0) return m
                const newReadBy = [
                  ...m.read_by,
                  ...matching.map((r: any) => ({ user_id: r.user_id, username: r.username, read_at: r.read_at })),
                ]
                // Deduplicate
                const seen = new Set<number>()
                const unique = newReadBy.filter((r) => {
                  if (seen.has(r.user_id)) return false
                  seen.add(r.user_id)
                  return true
                })
                return { ...m, read_by: unique }
              })
            )
            break
          }
          case 'force_disconnect':
            setForcedReason(event.reason)
            break
        }
      },
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
    })

    socketRef.current = sock

    return () => {
      sock.disconnect()
    }
  }, [ticketId, channelType, currentUserId])

  // Mark visible unread messages on mount
  useEffect(() => {
    if (!socketRef.current) return
    const unread = messages.filter(
      (m) => m.id && m.sender_id !== currentUserId && !m.read_by.some((r) => r.user_id === currentUserId)
    )
    if (unread.length > 0) {
      socketRef.current.markRead(unread.map((m) => m.id!))
    }
  }, [messages, currentUserId])

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return
    socketRef.current.sendMessage(input.trim(), replyTo?.id || undefined)
    setInput('')
    setReplyTo(null)
    // Stop typing
    if (isTypingRef.current) {
      socketRef.current.sendTyping(false)
      isTypingRef.current = false
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    if (!socketRef.current) return
    if (!isTypingRef.current && value.trim()) {
      socketRef.current.sendTyping(true)
      isTypingRef.current = true
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socketRef.current?.sendTyping(false)
        isTypingRef.current = false
      }
    }, 2000)
  }

  const handleReact = (msgId: number, emoji: string) => {
    socketRef.current?.react(msgId, emoji)
    setEmojiPickerMsgId(null)
  }

  // --- Styles ---
  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100%', minHeight: 350,
    border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#f9fafb',
  }
  const headerStyle: React.CSSProperties = {
    padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14,
  }
  const messagesAreaStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6,
  }
  const inputAreaStyle: React.CSSProperties = {
    padding: '10px 16px', borderTop: '1px solid #e5e7eb', background: '#fff',
    display: 'flex', gap: 8, alignItems: 'flex-end',
  }

  if (forcedReason) {
    return (
      <div style={containerStyle}>
        <div style={{ ...headerStyle, background: '#fef2f2' }}>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>Disconnected</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>{forcedReason}</p>
        </div>
      </div>
    )
  }

  const channelLabel = channelType === 'client_employee' ? 'Client ↔ Employee' : 'Admin ↔ Employee'

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 600 }}>{channelLabel} Chat</span>
        <span style={{ fontSize: 12, color: connected ? '#16a34a' : '#dc2626' }}>
          {connected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      {/* Messages */}
      <div style={messagesAreaStyle}>
        {messages.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto', fontSize: 13 }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === currentUserId
          const isSystem = msg.is_system_message

          if (isSystem) {
            return (
              <div key={msg.id ?? `sys-${idx}`} style={{ textAlign: 'center', padding: '6px 0' }}>
                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, padding: '4px 12px', borderRadius: 12 }}>
                  {msg.content}
                </span>
              </div>
            )
          }

          return (
            <div key={msg.id ?? idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
              {/* Sender name */}
              <span style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                {isMine ? 'You' : msg.sender_username}
                <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af' }}>
                  ({msg.sender_role})
                </span>
              </span>

              {/* Reply-to reference */}
              {msg.reply_to && (
                <div style={{ fontSize: 11, color: '#6b7280', borderLeft: '3px solid #d1d5db', paddingLeft: 8, marginBottom: 4, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ↳ {msg.reply_to.sender_username}: {msg.reply_to.content}
                </div>
              )}

              {/* Bubble */}
              <div
                style={{
                  background: isMine ? '#2563eb' : '#fff',
                  color: isMine ? '#fff' : '#1f2937',
                  padding: '8px 14px',
                  borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  border: isMine ? 'none' : '1px solid #e5e7eb',
                  fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                  position: 'relative',
                }}
              >
                {msg.content}
                <div style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.7)' : '#9ca3af', marginTop: 4 }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Reactions */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => msg.id && handleReact(msg.id, emoji)}
                      title={users.map((u) => u.username).join(', ')}
                      style={{
                        padding: '1px 6px', borderRadius: 10, border: '1px solid #e5e7eb', background: users.some((u) => u.user_id === currentUserId) ? '#dbeafe' : '#fff',
                        cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      {emoji} <span style={{ fontSize: 11, color: '#6b7280' }}>{users.length}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <button
                  onClick={() => setReplyTo(msg)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: '#6b7280', padding: 0 }}
                  title="Reply"
                >
                  ↩ Reply
                </button>
                <button
                  onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: '#6b7280', padding: 0 }}
                  title="React"
                >
                  😊
                </button>
              </div>

              {/* Inline emoji picker */}
              {emojiPickerMsgId === msg.id && msg.id && (
                <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', marginTop: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      onClick={() => handleReact(msg.id!, em)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 4px' }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Read receipts */}
              {isMine && msg.read_by && msg.read_by.filter((r) => r.user_id !== currentUserId).length > 0 && (
                <span style={{ fontSize: 10, color: '#2563eb', marginTop: 2 }}>
                  ✓✓ Read by {msg.read_by.filter((r) => r.user_id !== currentUserId).map((r) => r.username).join(', ')}
                </span>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div style={{ padding: '4px 16px', fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
          {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing…
        </div>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div style={{ padding: '6px 16px', background: '#eff6ff', borderTop: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#1d4ed8' }}>
            ↳ Replying to <strong>{replyTo.sender_username}</strong>: {replyTo.content.slice(0, 50)}{replyTo.content.length > 50 ? '…' : ''}
          </span>
          <button onClick={() => setReplyTo(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16, padding: 0 }}>&times;</button>
        </div>
      )}

      {/* Input */}
      <div style={inputAreaStyle}>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
            fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit',
            maxHeight: 100, overflow: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: input.trim() && connected ? '#2563eb' : '#d1d5db',
            color: '#fff', fontWeight: 600, cursor: input.trim() && connected ? 'pointer' : 'default',
            fontSize: 14,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

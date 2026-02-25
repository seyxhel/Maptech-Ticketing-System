import React, { useEffect, useState } from 'react'

interface Props {
  ticketId: number
  channelType: string
  currentUserId: number
  currentUserRole: string
}

const TicketChat: React.FC<Props> = ({ ticketId, channelType, currentUserId }) => {
  const [messages, setMessages] = useState<{id:number, sender:string, content:string}[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    // Placeholder: in real app this would fetch messages for ticket/channel
    setMessages([
      { id: 1, sender: 'system', content: `Loaded chat for ticket #${ticketId}` },
    ])
  }, [ticketId, channelType])

  const send = () => {
    if (!input.trim()) return
    setMessages((m) => [...m, { id: Date.now(), sender: `user:${currentUserId}`, content: input }])
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: 10, background: '#fff', flex: 1, overflowY: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{m.sender}</div>
            <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, display: 'inline-block' }}>{m.content}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 8, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }} />
        <button onClick={send} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  )
}

export default TicketChat

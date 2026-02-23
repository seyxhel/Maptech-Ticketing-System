import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { GreenButton } from '../components/ui/GreenButton';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { getTicketById } from '../data/mockTickets';

export function TicketView() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const stfFromUrl = params.get('stf') || undefined;

  const defaultTicket = {
    id: stfFromUrl ?? 'TK-9012',
    title: 'Database connection failure',
    priority: 'Critical' as const,
    status: 'In Progress' as const,
    sla: 2,
    total: 8,
    client: 'Acme Corp',
    created: '2026-02-20',
    description:
      'Intermittent failures observed connecting to the primary database. Errors occur under load and require immediate investigation.',
    contact: 'Mr. John Doe',
    assignedTo: 'gerardquadra',
    email: 'johndoe@example.com',
    mobile: '09696969696',
    address: 'Concepcion Uno, Marikina City',
    designation: '2nd floor'
  } as const;

  const found = getTicketById(stfFromUrl);
  const ticket = (found as any) || defaultTicket;
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Array<{from: 'client' | 'engineer' | 'system'; text: string; time?: string}>>([
    { from: 'client', text: 'Can you provide the latest logs?', time: '10:36 AM' },
    { from: 'engineer', text: "You're welcome, Mr. Doe. I'll update the ticket with today's actions.", time: '10:36 AM' }
  ]);
  const [newMsg, setNewMsg] = useState('');
  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages((m) => [...m, { from: 'client', text: newMsg.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setNewMsg('');
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <GreenButton variant="ghost" className="px-2 py-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </GreenButton>
        </div>
        <div>
          <button
            onClick={() => setShowChat(true)}
            title="Messages"
            aria-label="Open messages"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-700"
          >
            <MessageSquare className="w-4 h-4 text-[#0E8F79]" />
            Messages
          </button>
        </div>
      </div>
      {/* Expanded Ticket Details */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div><strong>Date:</strong> {ticket.created}</div>
            <div><strong>Client:</strong> {ticket.client}</div>
            <div><strong>Priority:</strong> <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">{ticket.priority}</span></div>
            <div><strong>Type Of Service:</strong> Demo/POC</div>
            <div><strong>Address:</strong> Concepcion Uno, Marikina City</div>
            <div><strong>Mobile:</strong> 09696969696</div>
            <div><strong>Department/Org:</strong> IT Department</div>
          </div>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {ticket.status}</div>
            <div><strong>Contact:</strong> Mr. John Doe</div>
            <div><strong>Assigned To:</strong> gerardquadra</div>
            <div><strong>Time In:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Email:</strong> johndoe@example.com</div>
            <div><strong>Designation:</strong> 2nd floor</div>
          </div>
        </div>
      </Card>

      

      {/* Employee Progress */}
      <div className="mt-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-4">
          <h4 className="text-sm font-semibold text-green-700">Employee Progress</h4>
          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <div><strong>Support Type</strong>: chat</div>
            <div><strong>Problem Description</strong>: System intermittently disconnects from hospital network during demo sessions, causing temporary data loss in patient monitoring dashboard.</div>
            <div><strong>Action Taken</strong>: Conducted initial diagnostics remotely. Verified network stability and device firmware version. Applied temporary patch to stabilize connection. Scheduled onsite follow-up for full system integration test.</div>
            <div><strong>Remarks</strong>: Issue appears related to network compatibility with hospital's existing infrastructure. Awaiting feedback from IT department after patch deployment.</div>
            <div><strong>Job Status</strong>: pending</div>
          </div>
        </div>
      </div>
      

      <Card>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h3 className="text-lg font-semibold">Description</h3>
          <p className="text-gray-700 dark:text-gray-300">{ticket.description}</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Created</h4>
              <div className="font-medium text-gray-900 dark:text-white">{ticket.created}</div>
            </div>
            <div className="col-span-1">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Response SLA</h4>
              <div className="mt-1"><SLATimer hoursRemaining={ticket.sla} totalHours={ticket.total} /></div>
            </div>
            <div className="col-span-1">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Activity</h4>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">2 comments • 1 attachment</div>
            </div>
          </div>

          
        </div>
      </Card>

      {/* Chat panel */}
      {showChat && (
        <div className="fixed right-6 bottom-6 top-16 w-96 max-w-full z-50 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-semibold">Client ↔ Employee Chat</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500">• Connected</span>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowChat(false)}>Close</button>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-auto space-y-3">
            {messages.map((m, i) => {
              const isEmployee = m.from === 'engineer';
              return (
                <div key={i} className={`flex ${isEmployee ? 'justify-start' : 'justify-end'}`}>
                  <div>
                    <div className={`${isEmployee ? 'inline-block bg-gray-100 dark:bg-gray-700 text-gray-900' : 'inline-block bg-blue-500 text-white'} px-4 py-2 rounded-lg max-w-[85%]`}>{m.text}</div>
                    <div className={`text-xs text-gray-400 mt-1 ${isEmployee ? 'text-left' : 'text-right'}`}>{m.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
              />
              <button onClick={sendMessage} className="px-3 py-2 rounded-md bg-[#63D44A] text-white">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketView;

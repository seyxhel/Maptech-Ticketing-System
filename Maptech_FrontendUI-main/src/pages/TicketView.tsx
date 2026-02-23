import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { GreenButton } from '../components/ui/GreenButton';
import { MessageSquare, ArrowLeft, Camera, Video, Upload, FileText, ClipboardList, Package, Paperclip, CheckCircle } from 'lucide-react';
import { getTicketById } from '../data/mockTickets';
import { useAuth } from '../context/AuthContext';

const JOB_STATUSES = ['Completed', 'Under Warranty', 'For Quotation', 'Pending', 'Chargeable', 'Under Contract'];

export function TicketView() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin';
  const canEdit = isEmployee || isAdmin;
  const { search, pathname } = useLocation();
  const params = new URLSearchParams(search);
  const stfFromUrl = params.get('stf') || undefined;

  const found = getTicketById(stfFromUrl);

  const ticket = found
    ? {
        id: found.id,
        priority: found.priority,
        status: found.status,
        sla: found.sla,
        total: found.total,
        client: found.client ?? 'Acme Corp',
        created: found.created ?? new Date().toLocaleDateString(),
        description: found.description ?? 'No description provided.',
        contact: found.contact ?? 'N/A',
        assignedTo: found.assignedTo ?? 'unassigned',
        issue: found.issue,
        productDetails: found.productDetails ?? null,
        actionTaken: found.actionTaken ?? '',
        remarks: found.remarks ?? '',
        jobStatus: found.jobStatus ?? '',
        ticketAttachments: found.ticketAttachments ?? [],
      }
    : {
        id: stfFromUrl ?? 'TK-9012',
        priority: 'Critical' as const,
        status: 'In Progress' as const,
        sla: 2,
        total: 8,
        client: 'Acme Corp',
        created: new Date().toLocaleDateString(),
        description:
          'Intermittent failures observed connecting to the primary database. Errors occur under load and require immediate investigation.',
        contact: 'Mr. John Doe',
        assignedTo: 'gerardquadra',
        issue: 'Database connection failure',
        productDetails: {
          deviceEquipment: 'Database Server',
          versionNo: 'PostgreSQL 15.2',
          datePurchased: 'Mar 15, 2024',
          serialNo: 'SRV-DB-2024-0451',
          warranty: 'With Warranty',
          brand: 'Dell',
          model: 'PowerEdge R750',
          salesNo: 'SO-2024-1087',
        },
        actionTaken: '',
        remarks: '',
        jobStatus: '',
        ticketAttachments: [] as { name: string; type: 'screenshot' | 'recording' }[],
      };

  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  // Chat tab: 'client' = client↔employee chat, 'admin' = admin↔employee chat
  const [chatTab, setChatTab] = useState<'client' | 'admin'>(isAdmin ? 'admin' : 'client');
  const [clientMessages, setClientMessages] = useState<Array<{from: 'client' | 'engineer' | 'system'; text: string; time?: string}>>([
    { from: 'client', text: 'Can you provide the latest logs?', time: '10:36 AM' },
    { from: 'engineer', text: "You're welcome, Mr. Doe. I'll update the ticket with today's actions.", time: '10:36 AM' }
  ]);
  const [adminMessages, setAdminMessages] = useState<Array<{from: 'admin' | 'engineer' | 'system'; text: string; time?: string}>>([
    { from: 'admin', text: 'Please prioritize this ticket. The client is escalating.', time: '9:15 AM' },
    { from: 'engineer', text: 'Understood, I\'m working on it now.', time: '9:20 AM' }
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [jobStatus, setJobStatus] = useState(ticket.jobStatus || '');
  const [actionTaken, setActionTaken] = useState(ticket.actionTaken || '');
  const [remarksText, setRemarksText] = useState(ticket.remarks || '');

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (chatTab === 'admin') {
      const from = isAdmin ? 'admin' : 'engineer';
      setAdminMessages((m) => [...m, { from, text: newMsg.trim(), time }]);
    } else {
      const from = isEmployee ? 'engineer' : 'client';
      setClientMessages((m) => [...m, { from, text: newMsg.trim(), time }]);
    }
    setNewMsg('');
  };

  const isMine = (from: string) => {
    if (chatTab === 'admin') {
      if (isAdmin) return from === 'admin';
      if (isEmployee) return from === 'engineer';
    }
    if (isEmployee) return from === 'engineer';
    if (isAdmin) return from === 'admin';
    return from === 'client';
  };
  
  const currentMessages = chatTab === 'admin' ? adminMessages : clientMessages;
  // Show tabs: employee sees both tabs, admin sees only admin tab, client sees only client tab
  const showTabs = isEmployee;

  return (
    <div className="space-y-6">
      {/* Back + Messages */}
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <MessageSquare className="w-4 h-4 text-[#0E8F79]" />
            Messages
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Ticket Information */}
        <div className="lg:col-span-3">
          <Card>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <PriorityBadge priority={ticket.priority} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.id}</h2>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            {/* Date Meta */}
            <div className="flex flex-wrap gap-6 text-sm mb-5">
              <div className="text-gray-500 dark:text-gray-400">
                Date Created <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">{ticket.created}</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Time In <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Client</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.client}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Contact Person</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.contact}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Type of Service</div>
                <div className="text-gray-900 dark:text-gray-100">Demo/POC</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Assigned To</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.assignedTo}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Department</div>
                <div className="text-gray-900 dark:text-gray-100">IT Department</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Issue</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.issue}</div>
              </div>
              {/* Description - Full Width */}
              <div className="col-span-2 mt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Description</div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-[#0E8F79]">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Product Details Section */}
            {ticket.productDetails && (
              <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Product Details
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Device / Equipment</div>
                    <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.deviceEquipment}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Version No.</div>
                    <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.versionNo}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Date Purchased</div>
                    <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.datePurchased}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Serial No.</div>
                    <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.serialNo}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Warranty</div>
                    <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.warranty}</div>
                  </div>
                  {ticket.productDetails.product && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Product</div>
                      <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.product}</div>
                    </div>
                  )}
                  {ticket.productDetails.brand && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Brand</div>
                      <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.brand}</div>
                    </div>
                  )}
                  {ticket.productDetails.model && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Model</div>
                      <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.model}</div>
                    </div>
                  )}
                  {ticket.productDetails.salesNo && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Sales No.</div>
                      <div className="text-gray-900 dark:text-gray-100">{ticket.productDetails.salesNo}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SLA Section */}
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Response SLA</div>
                  <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.total} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Activity</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">2 comments &bull; 1 attachment</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status of Job */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Status of Job
            </h3>
            <div className="flex flex-wrap gap-2">
              {JOB_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { if (canEdit) setJobStatus(s === jobStatus ? '' : s); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    jobStatus === s
                      ? 'bg-[#0E8F79] text-white border-[#0E8F79] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'
                  } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Action Taken */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Action Taken
            </h3>
            <textarea
              value={actionTaken}
              onChange={(e) => canEdit && setActionTaken(e.target.value)}
              readOnly={!canEdit}
              placeholder="Describe the actions taken to resolve the issue..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 resize-y outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79] transition-colors"
            />
          </Card>

          {/* Remarks */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Remarks
            </h3>
            <textarea
              value={remarksText}
              onChange={(e) => canEdit && setRemarksText(e.target.value)}
              readOnly={!canEdit}
              placeholder="Additional remarks or notes..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 resize-y outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79] transition-colors"
            />
          </Card>

          {/* Required Attachment */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Required Attachment
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-[#0E8F79]/50 transition-colors cursor-pointer">
                <Camera className="w-5 h-5 text-[#0E8F79]" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Screenshot / Picture</div>
                  <div className="text-xs text-gray-400">PNG, JPG up to 10MB</div>
                </div>
                <Upload className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-[#0E8F79]/50 transition-colors cursor-pointer">
                <Video className="w-5 h-5 text-[#0E8F79]" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Recording</div>
                  <div className="text-xs text-gray-400">MP4, WebM up to 50MB</div>
                </div>
                <Upload className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {ticket.ticketAttachments && ticket.ticketAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded Files</div>
                {ticket.ticketAttachments.map((att: { name: string; type: string }, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800">
                    {att.type === 'screenshot' ? <Camera className="w-4 h-4 text-green-600" /> : <Video className="w-4 h-4 text-green-600" />}
                    <span className="text-sm text-green-700 dark:text-green-400 flex-1">{att.name}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Chat panel */}
      {showChat && (
        <div className="fixed right-6 bottom-6 top-16 w-96 max-w-full z-50 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-semibold">
              {isAdmin ? 'Admin ↔ Employee' : chatTab === 'admin' ? 'Employee ↔ Admin' : isEmployee ? 'Employee ↔ Client' : 'Client ↔ Employee'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500">• Connected</span>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowChat(false)}>Close</button>
            </div>
          </div>
          {/* Tabs - only for employee */}
          {showTabs && (
            <div className="flex border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setChatTab('client')}
                className={`flex-1 px-4 py-2 text-xs font-semibold transition-colors ${
                  chatTab === 'client'
                    ? 'text-[#0E8F79] border-b-2 border-[#0E8F79] bg-green-50/50 dark:bg-green-900/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Client Chat
              </button>
              <button
                onClick={() => setChatTab('admin')}
                className={`flex-1 px-4 py-2 text-xs font-semibold transition-colors ${
                  chatTab === 'admin'
                    ? 'text-[#0E8F79] border-b-2 border-[#0E8F79] bg-green-50/50 dark:bg-green-900/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Admin Chat
              </button>
            </div>
          )}
          {/* Messages */}
          <div className="p-4 flex-1 overflow-auto space-y-3">
            {currentMessages.map((m, i) => {
              const mine = isMine(m.from);
              return (
                <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div>
                    <div className={`${mine ? 'inline-block bg-blue-500 text-white' : 'inline-block bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} px-4 py-2 rounded-lg max-w-[85%]`}>{m.text}</div>
                    <div className={`text-xs text-gray-400 mt-1 ${mine ? 'text-right' : 'text-left'}`}>{m.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Input */}
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

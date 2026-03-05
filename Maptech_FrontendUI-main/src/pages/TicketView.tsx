import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { GreenButton } from '../components/ui/GreenButton';
import {
  MessageSquare, ArrowLeft, Camera, Video, Upload, FileText, ClipboardList, Package,
  Paperclip, CheckCircle, Wifi, WifiOff, Send, X, Smile, Reply, ChevronDown,
  Search as SearchIcon, Check, CheckCheck, CornerDownRight, Maximize2, Minimize2,
  User as UserIcon, Shield, Image, Film, File, Download, Play, ArrowUpRight, Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TicketChatSocket } from '../services/chatService';
import type { ChatMessage, ChatEvent, ChatAttachment } from '../services/chatService';
import { fetchTicketByStf, fetchTicketById, uploadResolutionProof, deleteAttachment, closeTicket, updateEmployeeFields, saveProductDetails, escalateTicket, escalateExternal, startWork, createCSATFeedback, updateTicket, deleteTicket as apiDeleteTicket } from '../services/api';
import { toast } from 'sonner';
import type { BackendTicket } from '../services/api';
import { mapStatus, mapPriority, getAssigneeName, reverseMapStatus, reverseMapPriority } from '../services/ticketMapper';
import { Loader2, Trash2, Star, Clock, PlayCircle, Eye, PenLine } from 'lucide-react';
import { SignaturePad } from '../components/ui/SignaturePad';

const JOB_STATUSES = ['Completed', 'Under Warranty', 'For Quotation', 'Pending', 'Chargeable', 'Under Contract'];

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

const INPUT_EMOJIS: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🫢', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '🤥'] },
  { label: 'Gestures', emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👏', '🙌', '👐', '🤝', '🫶', '💪', '🫵', '☝️', '👆', '👇', '👈', '👉'] },
  { label: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝'] },
  { label: 'Objects', emojis: ['🎉', '🎊', '🎈', '🔥', '⭐', '🌟', '✨', '💫', '🏆', '🥇', '🎯', '💡', '📌', '📎', '✅', '❌', '⚠️', '💬', '👀', '🚀', '💻', '🔧', '🔨', '📱'] },
];

/** Group messages by date for separator rendering. */
function groupMessagesByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const d = new Date(msg.created_at).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (d !== currentDate) {
      currentDate = d;
      groups.push({ date: d, messages: [] });
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

/** Returns initials from a username. */
function getInitials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function TicketView() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isRoleEditable = isEmployee || isAdmin;
  const { search, pathname } = useLocation();
  const params = new URLSearchParams(search);
  const stfFromUrl = params.get('stf') || undefined;

  // Backend ticket state
  const [btLoading, setBtLoading] = useState(true);
  const [btData, setBtData] = useState<BackendTicket | null>(null);

  // Compute SLA from backend data
  function computeSla(bt: BackendTicket) {
    const prioritySlaHours: Record<string, number> = { critical: 4, high: 8, medium: 24, low: 48 };
    const totalSla = prioritySlaHours[bt.priority] || 24;
    const created = new Date(bt.created_at).getTime();
    const elapsed = (Date.now() - created) / (1000 * 60 * 60);
    return { sla: Math.max(0, Math.round(totalSla - elapsed)), total: totalSla };
  }

  // Build the ticket view object from backend data
  const ticket = btData
    ? (() => {
        const { sla, total } = computeSla(btData);
        return {
          id: btData.stf_no,
          priority: mapPriority(btData.priority) as 'Critical' | 'High' | 'Medium' | 'Low',
          status: mapStatus(btData.status, btData.assigned_to) as 'In Progress' | 'Assigned' | 'Resolved' | 'Closed' | 'Pending' | 'Escalated' | 'New',
          sla,
          total,
          client: btData.client || 'N/A',
          created: new Date(btData.created_at).toLocaleDateString(),
          description: btData.description_of_problem || 'No description provided.',
          contact: btData.contact_person || 'N/A',
          assignedTo: getAssigneeName(btData) || 'unassigned',
          issue: btData.description_of_problem || btData.type_of_service_detail?.name || 'No description',
          department: btData.department_organization || 'N/A',
          landline: btData.landline || 'N/A',
          mobile: btData.mobile_no || 'N/A',
          emailAddress: btData.email_address || 'N/A',
          fullAddress: btData.address || 'N/A',
          designation: btData.designation || 'N/A',
          preferredSupport: ({'remote_online':'Remote / Online','onsite':'Onsite','chat':'Chat','call':'Call'} as Record<string,string>)[btData.preferred_support_type] || btData.preferred_support_type || 'N/A',
          typeOfService: btData.type_of_service_detail?.name || btData.type_of_service_others || 'N/A',
          productDetails: (btData.device_equipment || btData.brand || btData.product || btData.model_name || btData.version_no || btData.date_purchased || btData.serial_no || btData.has_warranty) ? {
            deviceEquipment: btData.device_equipment || '',
            versionNo: btData.version_no || '',
            datePurchased: btData.date_purchased || '',
            serialNo: btData.serial_no || '',
            warranty: btData.has_warranty ? 'With Warranty' : 'Without Warranty',
            product: btData.product || '',
            brand: btData.brand || '',
            model: btData.model_name || '',
          } : null,
          actionTaken: btData.action_taken || '',
          remarks: btData.remarks || '',
          jobStatus: btData.job_status || '',
          ticketAttachments: (btData.attachments || []).map((a: any) => ({
            name: a.file?.split('/').pop() || 'file',
            type: (a.file?.match(/\.(mp4|webm)$/i) ? 'recording' : 'screenshot') as 'screenshot' | 'recording',
          })),
          timeIn: btData.time_in ? new Date(btData.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          timeOut: btData.time_out ? new Date(btData.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          progressPercentage: btData.progress_percentage ?? 0,
          slaEstimatedDays: btData.sla_estimated_days ?? null,
          cascadeType: btData.cascade_type || null,
          observation: btData.observation || '',
          signature: btData.signature || null,
          signedByName: btData.signed_by_name || '',
          csatFeedback: btData.csat_feedback || null,
        };
      })()
    : {
        id: stfFromUrl ?? 'TK-0000',
        priority: 'Medium' as const,
        status: 'New' as const,
        sla: 0,
        total: 24,
        client: '',
        created: '',
        description: 'Loading...',
        contact: '',
        assignedTo: '',
        issue: 'Loading...',
        department: '',
        landline: '',
        mobile: '',
        emailAddress: '',
        fullAddress: '',
        designation: '',
        preferredSupport: '',
        typeOfService: '',
        productDetails: null as { deviceEquipment: string; versionNo: string; datePurchased: string; serialNo: string; warranty: string; product?: string; brand?: string; model?: string } | null,
        actionTaken: '',
        remarks: '',
        jobStatus: '',
        ticketAttachments: [] as { name: string; type: 'screenshot' | 'recording' }[],
        timeIn: '',
        timeOut: '',
        progressPercentage: 0,
        slaEstimatedDays: null as number | null,
        cascadeType: null as string | null,
        observation: '',
        signature: null as string | null,
        signedByName: '',
        csatFeedback: null as any,
      };

  const navigate = useNavigate();
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);

  // ── WebSocket Chat State ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const chatSocketRef = useRef<TicketChatSocket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Enhanced chat UI state
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [hoveredMsgKey, setHoveredMsgKey] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // message key for emoji picker
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat attachment state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ file: File; url: string; type: 'image' | 'video' | 'file' }[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Resolution proof attachment state
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const recordingInputRef = useRef<HTMLInputElement>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [recordingFiles, setRecordingFiles] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    { id: number; name: string; type: 'screenshot' | 'recording'; url?: string }[]
  >([]);

  // Resolve the numeric ticket ID for the WebSocket
  const [backendTicketId, setBackendTicketId] = useState<number | null>(
    (location.state as any)?.backendTicketId ?? null
  );

  // Fetch backend ticket data
  useEffect(() => {
    const stf = stfFromUrl || (location.state as any)?.ticketId;
    const existingId = (location.state as any)?.backendTicketId ?? null;

    if (!stf && !existingId) { setBtLoading(false); return; }

    let cancelled = false;
    setBtLoading(true);

    const doFetch = existingId
      ? fetchTicketById(existingId)
      : fetchTicketByStf(stf!);

    doFetch.then((bt) => {
      if (!cancelled && bt) {
        setBackendTicketId(bt.id);
        setBtData(bt);
      }
    }).finally(() => { if (!cancelled) setBtLoading(false); });

    return () => { cancelled = true; };
  }, [stfFromUrl, location.state]);

  const handleChatEvent = useCallback((event: ChatEvent) => {
    switch (event.type) {
      case 'message_history':
        setChatMessages(event.messages);
        break;
      case 'new_message':
        setChatMessages((prev) => [...prev, event.message]);
        break;
      case 'typing':
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (event.is_typing) {
            next.set(event.user_id, event.username);
          } else {
            next.delete(event.user_id);
          }
          return next;
        });
        break;
      case 'reaction_update': {
        const { message_id, reactions } = event.data;
        setChatMessages((prev) =>
          prev.map((m) => {
            if (m.id !== message_id) return m;
            const grouped: ChatMessage['reactions'] = {};
            for (const r of reactions) {
              if (!grouped[r.emoji]) grouped[r.emoji] = [];
              grouped[r.emoji].push({ user_id: r.user_id, username: r.username });
            }
            return { ...m, reactions: grouped };
          })
        );
        break;
      }
      case 'read_receipt':
        // Could update read_by on messages — skipping for now
        break;
      case 'force_disconnect':
        setWsConnected(false);
        break;
    }
  }, []);

  // Open / close WebSocket when chat panel is toggled
  useEffect(() => {
    if (showChat && backendTicketId) {
      const sock = new TicketChatSocket(backendTicketId, 'admin_employee', {
        onEvent: handleChatEvent,
        onOpen: () => setWsConnected(true),
        onClose: () => setWsConnected(false),
        onError: () => setWsConnected(false),
      });
      chatSocketRef.current = sock;
      return () => {
        sock.disconnect();
        chatSocketRef.current = null;
      };
    }
    return undefined;
  }, [showChat, backendTicketId, handleChatEvent]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    const hasText = newMsg.trim().length > 0;
    const hasFiles = pendingFiles.length > 0;
    if (!hasText && !hasFiles) return;

    const sock = chatSocketRef.current;

    // Send attachments first (each as a separate message via WS)
    if (hasFiles && sock && sock.isConnected) {
      pendingFiles.forEach((file) => {
        sock.sendAttachment(file, '');
      });
    }

    // Build local attachment previews for offline mode
    const localAttachments: ChatAttachment[] = pendingFiles.map((file) => ({
      file_name: file.name,
      file_url: URL.createObjectURL(file),
      file_type: getFileCategory(file),
      file_size: file.size,
    }));

    if (sock && sock.isConnected) {
      if (hasText) {
        sock.sendMessage(newMsg.trim(), replyTo?.id ?? undefined);
      }
      sock.sendTyping(false);
    } else {
      // Offline fallback – show locally
      setChatMessages((prev) => [
        ...prev,
        {
          id: null,
          sender_id: user?.id ?? 0,
          sender_username: user?.username || user?.name || (isAdmin ? 'Supervisor' : 'Technical'),
          sender_role: user?.role || 'employee',
          content: newMsg.trim(),
          attachments: localAttachments.length > 0 ? localAttachments : undefined,
          reply_to: replyTo ? { id: replyTo.id!, content: replyTo.content.slice(0, 100), sender_id: replyTo.sender_id, sender_username: replyTo.sender_username } : null,
          is_system_message: false,
          reactions: {},
          read_by: [],
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setNewMsg('');
    setReplyTo(null);
    setHoveredMsgKey(null);
    setShowEmojiPicker(null);
    setShowInputEmoji(false);
    clearPendingFiles();
    inputRef.current?.focus();
  };

  const handleTyping = () => {
    const sock = chatSocketRef.current;
    if (!sock || !sock.isConnected) return;
    sock.sendTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sock.sendTyping(false), 2000);
  };

  const isMine = (msg: ChatMessage) => {
    if (user?.id) return msg.sender_id === user.id;
    // Fallback for test accounts without id
    if (isAdmin) return msg.sender_role === 'admin' || msg.sender_role === 'superadmin';
    if (isEmployee) return msg.sender_role === 'employee';
    return false;
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const filteredMessages = chatSearch.trim()
    ? chatMessages.filter((m) => m.content.toLowerCase().includes(chatSearch.toLowerCase()))
    : chatMessages;

  const messageGroups = groupMessagesByDate(filteredMessages);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollDown(!isNearBottom);
    if (isNearBottom) setUnreadCount(0);
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
  };

  // Track new messages while scrolled up
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (!isNearBottom && chatMessages.length > 0) {
      setUnreadCount((c) => c + 1);
    }
  }, [chatMessages.length]);

  // Avatar color based on role
  const getAvatarColor = (role: string) => {
    if (role === 'admin' || role === 'superadmin') return 'bg-blue-500';
    if (role === 'employee') return 'bg-[#0E8F79]';
    return 'bg-gray-500';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin' || role === 'superadmin') return Shield;
    return UserIcon;
  };

  // ── Attachment helpers ──
  const getFileCategory = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setPendingFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: getFileCategory(file),
    }));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removePendingFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index].url);
    setPendingFiles((prev) => prev.filter((_, j) => j !== index));
    setPreviewUrls((prev) => prev.filter((_, j) => j !== index));
  };

  const clearPendingFiles = () => {
    previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
    setPendingFiles([]);
    setPreviewUrls([]);
  };

  const getAttachmentTypeFromMime = (mime: string): 'image' | 'video' | 'file' => {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    return 'file';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return Image;
    if (fileType === 'video') return Film;
    return File;
  };

  // ── Non-chat form state ──
  const [jobStatus, setJobStatus] = useState(ticket.jobStatus || '');
  const [actionTaken, setActionTaken] = useState(ticket.actionTaken || '');
  const [remarksText, setRemarksText] = useState(ticket.remarks || '');
  const [savingFields, setSavingFields] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);

  // Admin edit/delete modal state
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [adminEditFields, setAdminEditFields] = useState({ status: ticket.status, priority: ticket.priority });
  const [savingAdminEdit, setSavingAdminEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(false);

  // ── New feature state ──
  const [observation, setObservation] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signedByName, setSignedByName] = useState('');
  const [startingWork, setStartingWork] = useState(false);
  const [showCsatModal, setShowCsatModal] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatComments, setCsatComments] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);

  // ── Escalation modal state ──
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateType, setEscalateType] = useState<'internal' | 'external'>('internal');
  const [escalateNotes, setEscalateNotes] = useState('');
  const [escalateTo, setEscalateTo] = useState('');
  const [escalateNotesErr, setEscalateNotesErr] = useState('');
  const [escalateToErr, setEscalateToErr] = useState('');
  const [submittingEscalation, setSubmittingEscalation] = useState(false);

  // ── Product Detail form state (employee-editable) ──
  const [pdDeviceEquipment, setPdDeviceEquipment] = useState('');
  const [pdProduct, setPdProduct] = useState('');
  const [pdBrand, setPdBrand] = useState('');
  const [pdModel, setPdModel] = useState('');
  const [pdVersionNo, setPdVersionNo] = useState('');
  const [pdSerialNo, setPdSerialNo] = useState('');
  const [pdDatePurchased, setPdDatePurchased] = useState('');
  const [pdHasWarranty, setPdHasWarranty] = useState(false);

  // Sync form state when backend data loads or updates
  useEffect(() => {
    if (btData) {
      setJobStatus(btData.job_status || '');
      setActionTaken(btData.action_taken || '');
      setRemarksText(btData.remarks || '');
      setPdDeviceEquipment(btData.device_equipment || '');
      setPdProduct(btData.product || '');
      setPdBrand(btData.brand || '');
      setPdModel(btData.model_name || '');
      setPdVersionNo(btData.version_no || '');
      setPdSerialNo(btData.serial_no || '');
      setPdDatePurchased(btData.date_purchased || '');
      setPdHasWarranty(btData.has_warranty ?? false);
      setObservation(btData.observation || '');
      setSignatureData(btData.signature || null);
      setSignedByName(btData.signed_by_name || '');
    }
  }, [btData]);

  // Fields are only editable by the assigned employee AND ticket is not Resolved/Closed
  // Admins can view but not edit these fields
  const isAssignedEmployee = isEmployee && btData?.assigned_to?.id === user?.id;
  const canEdit = isAssignedEmployee && ticket.status !== 'Resolved' && ticket.status !== 'Closed';

  const [savingProductDetails, setSavingProductDetails] = useState(false);

  /** Employee saves product details only (no status change) */
  const handleSaveProductDetails = async () => {
    if (!backendTicketId) return;
    setSavingProductDetails(true);
    try {
      const updated = await saveProductDetails(backendTicketId, {
        device_equipment: pdDeviceEquipment,
        product: pdProduct,
        brand: pdBrand,
        model_name: pdModel,
        version_no: pdVersionNo,
        serial_no: pdSerialNo,
        date_purchased: pdDatePurchased || null,
        has_warranty: pdHasWarranty,
      });
      setBtData(updated);
      toast.success('Product details saved successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product details.');
    } finally {
      setSavingProductDetails(false);
    }
  };

  /** Employee saves action taken, remarks, job status and resolves */
  const handleSaveFields = async () => {
    if (!backendTicketId) return;
    setSavingFields(true);
    try {
      const updated = await updateEmployeeFields(backendTicketId, {
        action_taken: actionTaken,
        remarks: remarksText,
        job_status: jobStatus,
        observation: observation,
        signature: signatureData || '',
        signed_by_name: signedByName,
      });
      setBtData(updated);
      toast.success('Ticket resolved successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve ticket.');
    } finally {
      setSavingFields(false);
    }
  };

  /** Employee escalates the ticket */
  const handleEscalateTicket = async () => {
    let hasErr = false;
    if (!escalateNotes.trim()) { setEscalateNotesErr('Notes / reason is required.'); hasErr = true; }
    if (escalateType === 'external' && !escalateTo.trim()) { setEscalateToErr('Distributor / vendor name is required.'); hasErr = true; }
    if (hasErr || !backendTicketId) return;
    setSubmittingEscalation(true);
    try {
      if (escalateType === 'internal') {
        const updated = await escalateTicket(backendTicketId, { notes: escalateNotes });
        setBtData(updated);
        toast.success('Ticket escalated to supervisor. It will be reassigned.');
      } else {
        const updated = await escalateExternal(backendTicketId, {
          external_escalated_to: escalateTo.trim(),
          external_escalation_notes: escalateNotes,
        });
        setBtData(updated);
        toast.success(`Ticket escalated externally to "${escalateTo.trim()}".`);
      }
      setShowEscalateModal(false);
      setEscalateNotes('');
      setEscalateTo('');
      setEscalateNotesErr('');
      setEscalateToErr('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to escalate ticket.');
    } finally {
      setSubmittingEscalation(false);
    }
  };

  /** Admin closes the ticket */
  const handleCloseTicket = async () => {
    if (!backendTicketId) return;
    if (!confirm('Are you sure you want to close this ticket?')) return;
    setClosingTicket(true);
    try {
      const updated = await closeTicket(backendTicketId);
      setBtData(updated);
      toast.success('Ticket closed successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to close ticket.');
    } finally {
      setClosingTicket(false);
    }
  };

  /** Employee starts work on the ticket (sets time_in) */
  const handleStartWork = async () => {
    if (!backendTicketId) return;
    setStartingWork(true);
    try {
      const updated = await startWork(backendTicketId);
      setBtData(updated);
      toast.success('Work started! Time In has been recorded.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start work.');
    } finally {
      setStartingWork(false);
    }
  };

  const ADMIN_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
  const ADMIN_STATUSES = ['New', 'Assigned', 'In Progress', 'Escalated', 'Resolved', 'Closed', 'Pending'];

  const openAdminEdit = () => {
    setAdminEditFields({ status: ticket.status, priority: ticket.priority });
    setAdminEditOpen(true);
  };

  const saveAdminEdit = async () => {
    if (!backendTicketId) return;
    try {
      const updated = await updateTicket(backendTicketId, {
        status: reverseMapStatus(adminEditFields.status),
        priority: reverseMapPriority(adminEditFields.priority),
      } as any);
      setBtData(updated);
      toast.success('Ticket updated.');
      setAdminEditOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update ticket.');
    }
  };

  const handleAdminDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmAdminDelete = async () => {
    if (!backendTicketId) return;
    setDeletingAdmin(true);
    try {
      await apiDeleteTicket(backendTicketId);
      toast.success('Ticket deleted.');
      navigate('/admin/tickets');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete ticket.');
    } finally {
      setDeletingAdmin(false);
      setShowDeleteConfirm(false);
    }
  };

  /** Admin submits CSAT feedback then closes ticket */
  const handleCsatClose = async () => {
    if (!backendTicketId || !btData) return;
    if (csatRating < 1) { toast.error('Please rate the technical (1-5 stars).'); return; }
    setSubmittingCsat(true);
    try {
      await createCSATFeedback({
        ticket: backendTicketId,
        employee: btData.assigned_to?.id ?? 0,
        rating: csatRating,
        comments: csatComments || undefined,
      });
      const updated = await closeTicket(backendTicketId);
      setBtData(updated);
      setShowCsatModal(false);
      setCsatRating(0);
      setCsatComments('');
      toast.success('CSAT submitted and ticket closed.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit CSAT or close ticket.');
    } finally {
      setSubmittingCsat(false);
    }
  };

  // ── Attachment file handlers ──
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
  const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
  const VIDEO_TYPES = ['video/mp4', 'video/webm'];

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (!IMAGE_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not a supported image format. Use PNG or JPG.`);
        return false;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        toast.error(`"${f.name}" exceeds the 10 MB limit.`);
        return false;
      }
      return true;
    });
    if (valid.length) setScreenshotFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const handleRecordingSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (!VIDEO_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not a supported video format. Use MP4 or WebM.`);
        return false;
      }
      if (f.size > MAX_VIDEO_SIZE) {
        toast.error(`"${f.name}" exceeds the 50 MB limit.`);
        return false;
      }
      return true;
    });
    if (valid.length) setRecordingFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeScreenshot = (idx: number) => setScreenshotFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeRecording = (idx: number) => setRecordingFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUploadAttachments = async () => {
    if (!backendTicketId) return;
    const allFiles = [...screenshotFiles, ...recordingFiles];
    if (!allFiles.length) return;
    setUploadingAttachments(true);
    try {
      const result = await uploadResolutionProof(backendTicketId, allFiles);
      const uploaded = (result as any[]).map((att: any) => ({
        id: att.id,
        name: att.file?.split('/').pop() || 'file',
        type: (att.file?.match(/\.(mp4|webm)$/i) ? 'recording' : 'screenshot') as 'screenshot' | 'recording',
        url: att.file,
      }));
      setUploadedAttachments((prev) => [...prev, ...uploaded]);
      setScreenshotFiles([]);
      setRecordingFiles([]);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleRemoveUploaded = async (att: { id: number; name: string }) => {
    if (!backendTicketId) return;
    if (!confirm(`Remove "${att.name}"?`)) return;
    try {
      await deleteAttachment(backendTicketId, att.id);
      setUploadedAttachments((prev) => prev.filter((a) => a.id !== att.id));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove attachment.');
    }
  };

  return (
    <div className="space-y-6">
      {btLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0E8F79]" />
        </div>
      ) : (
      <>
      {/* Back + Messages */}
      <div className="mb-4 flex items-center justify-between sticky top-0 z-30 bg-gray-50 dark:bg-gray-950 py-2 -mx-1 px-1">
        <div>
          <GreenButton variant="ghost" className="px-2 py-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </GreenButton>
        </div>
        <div className="flex items-center gap-2">
          {isAssignedEmployee && ticket.status !== 'Closed' && ticket.status !== 'Escalated' && ticket.status !== 'Resolved' && (
            <button
              onClick={() => setShowEscalateModal(true)}
              title="Escalate Ticket"
              aria-label="Escalate ticket"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Escalate
            </button>
          )}
          <button
            onClick={() => setShowChat(true)}
            title="Messages"
            aria-label="Open messages"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <MessageSquare className="w-4 h-4 text-[#0E8F79]" />
            Messages
          </button>
          {isAdmin && (
            <>
              <button onClick={handleAdminDelete} title="Delete Ticket" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800 text-sm text-red-700 dark:text-red-400">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          )}
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
                Time In <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">{ticket.timeIn}</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Time Out <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">{ticket.timeOut}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79]">Progress</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{ticket.progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    ticket.progressPercentage >= 100 ? 'bg-green-500' : ticket.progressPercentage >= 50 ? 'bg-[#0E8F79]' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(ticket.progressPercentage, 100)}%` }}
                />
              </div>
              {ticket.slaEstimatedDays && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  SLA Estimated Resolution: <span className="font-medium">{ticket.slaEstimatedDays} day{ticket.slaEstimatedDays !== 1 ? 's' : ''}</span>
                </p>
              )}
            </div>

            {/* Cascade Type Badge */}
            {ticket.cascadeType && (
              <div className="mb-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  ticket.cascadeType === 'internal'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {ticket.cascadeType === 'internal' ? <Shield className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                  {ticket.cascadeType === 'internal' ? 'Internal Cascade' : 'External Cascade'}
                </span>
              </div>
            )}

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
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Landline No.</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.landline}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Mobile No.</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.mobile}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Email Address</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.emailAddress}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Designation</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.designation}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Department/Organization</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.department}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Full Address</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.fullAddress}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Type of Service</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.typeOfService}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Preferred Type of Support</div>
                <div className="text-gray-900 dark:text-gray-100">{ticket.preferredSupport}</div>
              </div>
              {/* Description - Full Width */}
              <div className="col-span-2 mt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#0E8F79] mb-1">Description</div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-[#0E8F79]">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Product Details Section — editable by assigned employee, read-only for others */}
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Product Details
                {canEdit && <span className="text-[10px] font-normal normal-case text-gray-400">(fill in after assignment)</span>}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {/* Device / Equipment */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Device / Equipment</div>
                  {canEdit ? (
                    <input value={pdDeviceEquipment} onChange={(e) => setPdDeviceEquipment(e.target.value)} placeholder="e.g. Laptop, Printer" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdDeviceEquipment || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Product */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Product</div>
                  {canEdit ? (
                    <input value={pdProduct} onChange={(e) => setPdProduct(e.target.value)} placeholder="Product name" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdProduct || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Brand */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Brand</div>
                  {canEdit ? (
                    <input value={pdBrand} onChange={(e) => setPdBrand(e.target.value)} placeholder="Brand name" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdBrand || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Model */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Model</div>
                  {canEdit ? (
                    <input value={pdModel} onChange={(e) => setPdModel(e.target.value)} placeholder="Model name" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdModel || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Version No. */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Version No.</div>
                  {canEdit ? (
                    <input value={pdVersionNo} onChange={(e) => setPdVersionNo(e.target.value)} placeholder="Version number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdVersionNo || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Serial No. */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Serial No.</div>
                  {canEdit ? (
                    <input value={pdSerialNo} onChange={(e) => setPdSerialNo(e.target.value)} placeholder="Serial number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdSerialNo || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Date Purchased */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Date Purchased</div>
                  {canEdit ? (
                    <input type="date" value={pdDatePurchased} onChange={(e) => setPdDatePurchased(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]" />
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdDatePurchased || <span className="text-gray-400 italic">Not yet filled</span>}</div>
                  )}
                </div>
                {/* Warranty */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Warranty</div>
                  {canEdit ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPdHasWarranty(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          pdHasWarranty
                            ? 'bg-[#0E8F79] text-white border-[#0E8F79] shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'
                        }`}
                      >
                        With Warranty
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdHasWarranty(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          !pdHasWarranty
                            ? 'bg-gray-500 text-white border-gray-500 shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        Without Warranty
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100">{pdHasWarranty ? 'With Warranty' : 'Without Warranty'}</div>
                  )}
                </div>
              </div>
              {/* Save Product Details button (employee only) */}
              {canEdit && (
                <button
                  type="button"
                  disabled={savingProductDetails}
                  onClick={handleSaveProductDetails}
                  className="mt-4 w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-sm"
                >
                  {savingProductDetails ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Save Product Details</>
                  )}
                </button>
              )}
            </div>

            {/* ── Digital Signature Section ── */}
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
                <PenLine className="w-4 h-4" /> Digital Signature
              </h3>
              {signatureData ? (
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <img src={signatureData} alt="Digital Signature" className="max-h-24 mx-auto" />
                  </div>
                  {signedByName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Signed by: <span className="font-medium text-gray-700 dark:text-gray-300">{signedByName}</span></p>
                  )}
                </div>
              ) : canEdit ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your Name</label>
                    <input
                      value={signedByName}
                      onChange={(e) => setSignedByName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]"
                    />
                  </div>
                  <SignaturePad onSave={(data) => setSignatureData(data)} />
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No signature captured yet</p>
              )}
            </div>

          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Action Taken */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Action Taken
            </h3>
            <textarea
              value={actionTaken}
              onChange={(e) => canEdit && setActionTaken(e.target.value)}
              disabled={!canEdit}
              placeholder="Describe the actions taken to resolve the issue..."
              className={`w-full min-h-[100px] p-3 rounded-lg border text-sm resize-y outline-none transition-colors ${
                canEdit
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
              }`}
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
              disabled={!canEdit}
              placeholder="Additional remarks or notes..."
              className={`w-full min-h-[80px] p-3 rounded-lg border text-sm resize-y outline-none transition-colors ${
                canEdit
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79]'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
              }`}
            />
          </Card>

          {/* Required Attachment */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Required Attachment
            </h3>

            {/* Hidden file inputs */}
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              className="hidden"
              onChange={handleScreenshotSelect}
            />
            <input
              ref={recordingInputRef}
              type="file"
              accept="video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={handleRecordingSelect}
            />

            <div className="space-y-3">
              {/* Screenshot / Picture trigger */}
              <button
                type="button"
                onClick={() => canEdit && screenshotInputRef.current?.click()}
                disabled={!canEdit}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border border-dashed transition-colors text-left ${
                  canEdit
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-[#0E8F79] hover:bg-[#0E8F79]/5 cursor-pointer'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <Camera className="w-5 h-5 text-[#0E8F79]" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Screenshot / Picture</div>
                  <div className="text-xs text-gray-400">PNG, JPG up to 10MB</div>
                </div>
                <Upload className="w-4 h-4 text-gray-400" />
              </button>

              {/* Selected screenshot files */}
              {screenshotFiles.length > 0 && (
                <div className="space-y-1.5 ml-8">
                  {screenshotFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                      <Camera className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-blue-700 dark:text-blue-400 flex-1 truncate">{f.name}</span>
                      <span className="text-[10px] text-blue-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                      <button type="button" onClick={() => removeScreenshot(i)} className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                        <X className="w-3.5 h-3.5 text-blue-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recording trigger */}
              <button
                type="button"
                onClick={() => canEdit && recordingInputRef.current?.click()}
                disabled={!canEdit}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border border-dashed transition-colors text-left ${
                  canEdit
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-[#0E8F79] hover:bg-[#0E8F79]/5 cursor-pointer'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <Video className="w-5 h-5 text-[#0E8F79]" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Recording</div>
                  <div className="text-xs text-gray-400">MP4, WebM up to 50MB</div>
                </div>
                <Upload className="w-4 h-4 text-gray-400" />
              </button>

              {/* Selected recording files */}
              {recordingFiles.length > 0 && (
                <div className="space-y-1.5 ml-8">
                  {recordingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800">
                      <Video className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      <span className="text-xs text-purple-700 dark:text-purple-400 flex-1 truncate">{f.name}</span>
                      <span className="text-[10px] text-purple-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                      <button type="button" onClick={() => removeRecording(i)} className="p-0.5 rounded hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
                        <X className="w-3.5 h-3.5 text-purple-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload button (appears when files are selected) */}
            {canEdit && (screenshotFiles.length > 0 || recordingFiles.length > 0) && (
              <button
                type="button"
                disabled={uploadingAttachments}
                onClick={handleUploadAttachments}
                className="mt-3 w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-sm"
              >
                {uploadingAttachments ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {screenshotFiles.length + recordingFiles.length} file{screenshotFiles.length + recordingFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}

            {/* Already uploaded attachments (from backend or just uploaded) */}
            {(uploadedAttachments.length > 0 || (ticket.ticketAttachments && ticket.ticketAttachments.length > 0)) && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded Files</div>
                {uploadedAttachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 group">
                    {att.type === 'screenshot' ? <Camera className="w-4 h-4 text-green-600" /> : <Video className="w-4 h-4 text-green-600" />}
                    <span className="text-sm text-green-700 dark:text-green-400 flex-1 truncate">{att.name}</span>
                    {att.url && (
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
                        <Download className="w-3.5 h-3.5 text-green-500" />
                      </a>
                    )}
                    {canEdit && (
                      <button type="button" onClick={() => handleRemoveUploaded(att)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                ))}
                {ticket.ticketAttachments?.map((att: { name: string; type: string }, i: number) => (
                  <div key={`legacy-${i}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800">
                    {att.type === 'screenshot' ? <Camera className="w-4 h-4 text-green-600" /> : <Video className="w-4 h-4 text-green-600" />}
                    <span className="text-sm text-green-700 dark:text-green-400 flex-1">{att.name}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status of Job */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Status of Job
            </h3>
            <div className="flex flex-wrap gap-2">
              {JOB_STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={!canEdit}
                  onClick={() => { if (canEdit) setJobStatus(s === jobStatus ? '' : s); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    jobStatus === s
                      ? 'bg-[#0E8F79] text-white border-[#0E8F79] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'
                  } ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Employee Performance Rating (visible once ticket is closed) */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E8F79] mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" /> Technical Performance Rating
            </h3>
            {ticket.csatFeedback ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#0E8F79] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {ticket.assignedTo?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.assignedTo || 'Technical'}</p>
                    <p className="text-xs text-gray-400">Assigned Technical</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-5 h-5 ${s <= ticket.csatFeedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                  ))}
                  <span className="ml-2 text-sm font-bold text-gray-700 dark:text-gray-300">{ticket.csatFeedback.rating}/5</span>
                  <span className="ml-1 text-xs text-gray-400">
                    {ticket.csatFeedback.rating <= 2 ? 'Needs Improvement' : ticket.csatFeedback.rating <= 3 ? 'Satisfactory' : ticket.csatFeedback.rating <= 4 ? 'Good' : 'Excellent'}
                  </span>
                </div>
                {ticket.csatFeedback.comments && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Feedback</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{ticket.csatFeedback.comments}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {ticket.assignedTo && ticket.assignedTo !== 'unassigned' ? ticket.assignedTo.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.assignedTo && ticket.assignedTo !== 'unassigned' ? ticket.assignedTo : 'Unassigned'}</p>
                    <p className="text-xs text-gray-400">Assigned Technical</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  ))}
                  <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">—/5</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Feedback</p>
                  <p className="text-sm text-gray-300 dark:text-gray-600 italic">Will be provided upon ticket closure</p>
                </div>
              </div>
            )}
          </Card>

          {/* ── Action Buttons ── */}
          {ticket.status !== 'Closed' && (
            <div className="space-y-3">
              {/* Employee: Start Work (only if assigned, status is Assigned/New, no time_in yet) */}
              {isAssignedEmployee && !btData?.time_in && (ticket.status === 'Assigned' || ticket.status === 'New' || ticket.status === 'In Progress') && (
                <button
                  type="button"
                  disabled={startingWork}
                  onClick={handleStartWork}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-sm"
                >
                  {startingWork ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
                  ) : (
                    <><PlayCircle className="w-4 h-4" /> Start Work</>
                  )}
                </button>
              )}
              {/* Employee: Resolve Ticket (only if work has been started and not yet Resolved) */}
              {isAssignedEmployee && !!btData?.time_in && ticket.status !== 'Resolved' && (
                <button
                  type="button"
                  disabled={savingFields}
                  onClick={handleSaveFields}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#0E8F79] to-[#0b7a67] hover:shadow-lg hover:shadow-[#0E8F79]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-sm"
                >
                  {savingFields ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Resolving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Resolve</>
                  )}
                </button>
              )}
              {/* Admin: Close Ticket (triggers rating modal) */}
              {isAdmin && ticket.status === 'Resolved' && (
                <button
                  type="button"
                  onClick={() => setShowCsatModal(true)}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <X className="w-4 h-4" /> Close Ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           ENHANCED CHAT PANEL
           ═══════════════════════════════════════════════════════════ */}
      {showChat && (
        <div
          className={`fixed z-50 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-in-out ${
            chatExpanded
              ? 'right-4 bottom-4 top-4 left-4 lg:left-[calc(50%-24rem)] lg:right-4 lg:top-4 lg:bottom-4'
              : 'right-6 bottom-6 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)]'
          }`}
        >
          {/* ── Chat Header ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#0E8F79] to-[#0b7a67]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {isAdmin ? 'Supervisor ↔ Technical' : 'Technical ↔ Supervisor'}
                </div>
                <div className="flex items-center gap-1.5">
                  {wsConnected ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" /> Connected
                    </span>
                  ) : backendTicketId ? (
                    <span className="flex items-center gap-1 text-[10px] text-yellow-200">
                      <WifiOff className="w-2.5 h-2.5" /> Reconnecting…
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/60">Offline mode</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Search toggle */}
              <button
                onClick={() => { setShowChatSearch(!showChatSearch); setChatSearch(''); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Search messages"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
              {/* Expand/Collapse */}
              <button
                onClick={() => setChatExpanded(!chatExpanded)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title={chatExpanded ? 'Minimize' : 'Maximize'}
              >
                {chatExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {/* Close */}
              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Search Bar (conditional) ── */}
          {showChatSearch && (
            <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  autoFocus
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#0E8F79]/30"
                />
                {chatSearch && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Messages Area ── */}
          <div className="flex-1 relative overflow-hidden">
            {/* Persistent watermark logo */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
              <img
                src="/Maptech Official Logo version2 (1).png"
                alt=""
                className="w-40 h-auto opacity-40 dark:opacity-40 dark:brightness-150 dark:contrast-125 select-none"
                draggable={false}
              />
            </div>

            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 space-y-1 scroll-smooth relative z-[1]"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
            >
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center text-center pt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">Start the conversation between supervisor and technical here.</p>
              </div>
            )}

            {messageGroups.map((group) => (
              <React.Fragment key={group.date}>
                {/* ── Date Separator ── */}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {group.messages.map((m, i) => {
                  const mine = isMine(m);
                  const prevMsg = i > 0 ? group.messages[i - 1] : null;
                  const isConsecutive = prevMsg && prevMsg.sender_id === m.sender_id && !m.is_system_message && !prevMsg.is_system_message;
                  const RoleIcon = getRoleIcon(m.sender_role);

                  // System message
                  if (m.is_system_message) {
                    return (
                      <div key={m.id ?? `sys-${i}`} className="flex justify-center py-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{m.content}</span>
                        </div>
                      </div>
                    );
                  }

                  const msgKey = m.id != null ? `id-${m.id}` : `idx-${i}`;

                  return (
                    <div
                      key={msgKey}
                      className={`group flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                      onMouseEnter={() => setHoveredMsgKey(msgKey)}
                      onMouseLeave={() => { setHoveredMsgKey(null); setShowEmojiPicker(null); }}
                    >
                      {/* Avatar */}
                      {!isConsecutive ? (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(m.sender_role)} flex items-center justify-center shadow-sm`}>
                          <span className="text-[10px] font-bold text-white">{getInitials(m.sender_username)}</span>
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      {/* Message Content */}
                      <div className={`relative max-w-[75%] min-w-0 ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Sender Name + Role badge (first in group) */}
                        {!isConsecutive && !mine && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{m.sender_username}</span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                              m.sender_role === 'admin' || m.sender_role === 'superadmin'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              <RoleIcon className="w-2.5 h-2.5" />
                              {m.sender_role}
                            </span>
                          </div>
                        )}

                        {/* Reply preview */}
                        {m.reply_to && (
                          <div className={`mb-1 px-2.5 py-1.5 rounded-lg text-[11px] border-l-2 border-[#0E8F79] overflow-hidden max-w-full min-w-0 ${
                            mine
                              ? 'bg-[#0E8F79]/20 text-white/80 self-end'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            <div className="flex items-center gap-1 mb-0.5">
                              <CornerDownRight className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="font-semibold truncate">{m.reply_to.sender_username}</span>
                            </div>
                            <p className="truncate opacity-80">{m.reply_to.content}</p>
                          </div>
                        )}

                        {/* Bubble + hover actions row */}
                        <div className="relative">
                          {/* Emoji picker popover – FB Messenger style floating bar above bubble */}
                          {showEmojiPicker === msgKey && (
                            <div className={`absolute bottom-full mb-1 ${mine ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-600 px-2 py-1.5 z-20 flex gap-0.5`}>
                              {QUICK_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => { chatSocketRef.current?.react(m.id!, emoji); setShowEmojiPicker(null); }}
                                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-base transition-all hover:scale-125 active:scale-90"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className={`flex items-center gap-1 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Bubble */}
                            <div
                              className={`overflow-hidden text-[13px] leading-relaxed ${
                                mine
                                  ? 'bg-[#0E8F79] text-white rounded-2xl rounded-br-md shadow-sm'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-sm'
                              }`}
                            >
                              {/* Attachments inside bubble */}
                              {m.attachments && m.attachments.length > 0 && (
                                <div className={`${m.content ? '' : ''} ${m.attachments.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
                                  {m.attachments.map((att, ai) => {
                                    const attType = att.file_type?.startsWith('image') ? 'image' : att.file_type?.startsWith('video') ? 'video' : (att.file_type as string);
                                    if (attType === 'image') {
                                      return (
                                        <button
                                          key={ai}
                                          onClick={() => setLightboxUrl(att.file_url)}
                                          className="block w-full cursor-pointer hover:opacity-90 transition-opacity"
                                        >
                                          <img
                                            src={att.file_url}
                                            alt={att.file_name}
                                            className="w-full max-h-52 object-cover"
                                            loading="lazy"
                                          />
                                        </button>
                                      );
                                    }
                                    if (attType === 'video') {
                                      return (
                                        <div key={ai} className="relative">
                                          <video
                                            src={att.file_url}
                                            className="w-full max-h-52 object-cover"
                                            controls
                                            preload="metadata"
                                          />
                                        </div>
                                      );
                                    }
                                    // Generic file
                                    const FileIcon = getFileIcon(attType);
                                    return (
                                      <a
                                        key={ai}
                                        href={att.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 px-3 py-2 m-1 rounded-lg transition-colors ${
                                          mine
                                            ? 'bg-white/10 hover:bg-white/20'
                                            : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                      >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          mine ? 'bg-white/20' : 'bg-[#0E8F79]/10'
                                        }`}>
                                          <FileIcon className={`w-4 h-4 ${mine ? 'text-white' : 'text-[#0E8F79]'}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className={`text-xs font-medium truncate ${mine ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{att.file_name}</div>
                                          {att.file_size && (
                                            <div className={`text-[10px] ${mine ? 'text-white/60' : 'text-gray-400'}`}>{formatFileSize(att.file_size)}</div>
                                          )}
                                        </div>
                                        <Download className={`w-3.5 h-3.5 flex-shrink-0 ${mine ? 'text-white/60' : 'text-gray-400'}`} />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                              {/* Text content */}
                              {m.content && <div className="px-3.5 py-2 break-words overflow-hidden" style={{ overflowWrap: 'anywhere' }}>{m.content}</div>}
                            </div>

                            {/* Hover actions – side of bubble */}
                            {hoveredMsgKey === msgKey && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => { setReplyTo(m); inputRef.current?.focus(); }}
                                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  title="Reply"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setShowEmojiPicker(showEmojiPicker === msgKey ? null : msgKey)}
                                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  title="React"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* FB Messenger-style reaction pills – floating at bottom of bubble */}
                          {Object.keys(m.reactions).length > 0 && (
                            <div className={`flex items-center -mt-2 mb-1 ${mine ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
                              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-600">
                                {Object.entries(m.reactions).map(([emoji, users]) => {
                                  const iReacted = users.some((u) => u.user_id === (user?.id ?? 0));
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => chatSocketRef.current?.react(m.id!, emoji)}
                                      className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                        iReacted ? 'bg-[#0E8F79]/10' : ''
                                      }`}
                                      title={users.map((u) => u.username).join(', ')}
                                    >
                                      <span className="text-sm">{emoji}</span>
                                      {users.length > 1 && <span className="text-[10px] font-medium text-gray-500">{users.length}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Time + Read receipt */}
                        <div className={`flex items-center gap-1.5 mt-0.5 ${mine ? 'justify-end mr-1' : 'ml-1'}`}>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(m.created_at)}</span>
                          {mine && (
                            m.read_by.length > 0
                              ? <CheckCheck className="w-3 h-3 text-blue-400" title={`Read by ${m.read_by.map((r) => r.username).join(', ')}`} />
                              : <Check className="w-3 h-3 text-gray-400" title="Sent" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Typing indicators */}
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 mt-2 ml-10">
                <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {Array.from(typingUsers.values()).join(', ')} typing…
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* ── Scroll-to-bottom FAB ── */}
          {showScrollDown && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={scrollToBottom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 hover:shadow-xl transition-all"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Scroll to bottom'}
              </button>
            </div>
          )}
          </div>

          {/* ── Reply Preview Bar ── */}
          {replyTo && (
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-[#0E8F79]/5 dark:bg-[#0E8F79]/10">
              <CornerDownRight className="w-4 h-4 text-[#0E8F79] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#0E8F79]">Replying to {replyTo.sender_username}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate break-words" style={{ overflowWrap: 'anywhere' }}>{replyTo.content}</div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Input Area ── */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            {/* Emoji Picker Popover */}
            {showInputEmoji && (
              <div className="mx-3 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="max-h-52 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                  {INPUT_EMOJIS.map((cat) => (
                    <div key={cat.label}>
                      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-1">{cat.label}</div>
                      <div className="flex flex-wrap gap-0.5">
                        {cat.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewMsg((prev) => prev + emoji);
                              inputRef.current?.focus();
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-lg transition-transform hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File preview strip */}
            {previewUrls.length > 0 && (
              <div className="px-3 pt-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                {previewUrls.map((p, idx) => (
                  <div key={idx} className="relative flex-shrink-0 group/preview">
                    {p.type === 'image' ? (
                      <img src={p.url} alt={p.file.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                    ) : p.type === 'video' ? (
                      <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                        <video src={p.url} className="w-full h-full object-cover opacity-60" preload="metadata" />
                        <Play className="w-5 h-5 text-white absolute" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center px-1">
                        <File className="w-5 h-5 text-gray-400 mb-0.5" />
                        <span className="text-[8px] text-gray-500 truncate w-full text-center">{p.file.name.split('.').pop()?.toUpperCase()}</span>
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removePendingFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover/preview:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {/* File size */}
                    <div className="absolute bottom-0.5 left-0.5 right-0.5 text-center">
                      <span className="text-[8px] bg-black/50 text-white px-1 rounded">{formatFileSize(p.file.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ''; }}
              className="hidden"
            />

            <div className="flex items-end gap-1.5 px-3 py-3">
              {/* Attachment button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#0E8F79] hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Emoji toggle button */}
              <button
                onClick={() => setShowInputEmoji(!showInputEmoji)}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  showInputEmoji
                    ? 'bg-[#0E8F79]/10 text-[#0E8F79] ring-2 ring-[#0E8F79]/30'
                    : 'text-gray-400 hover:text-[#0E8F79] hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={newMsg}
                  onChange={(e) => { setNewMsg(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); setShowInputEmoji(false); } }}
                  onFocus={() => { /* keep picker open */ }}
                  placeholder={replyTo ? `Reply to ${replyTo.sender_username}...` : pendingFiles.length > 0 ? 'Add a caption...' : 'Type a message...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#0E8F79]/30 focus:border-[#0E8F79] transition-all placeholder:text-gray-400"
                />
              </div>
              <button
                onClick={() => { sendMessage(); setShowInputEmoji(false); }}
                disabled={!newMsg.trim() && pendingFiles.length === 0}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0E8F79] hover:bg-[#0b7a67] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all hover:shadow-md disabled:hover:shadow-none"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Admin Edit Modal ── */}
      {adminEditOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#3BC25B]/20 flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-[#3BC25B]" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Edit Ticket</h3>
                  <p className="text-gray-400 dark:text-white/40 text-xs">Update status and priority</p>
                </div>
              </div>
              <button onClick={() => setAdminEditOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-2 uppercase tracking-wider">Status</label>
                <select value={adminEditFields.status} onChange={(e) => setAdminEditFields((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none">
                  {ADMIN_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-2 uppercase tracking-wider">Priority</label>
                <select value={adminEditFields.priority} onChange={(e) => setAdminEditFields((p) => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none">
                  {ADMIN_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6">
              <button type="button" onClick={() => setAdminEditOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium transition-all">Cancel</button>
              <button type="button" disabled={savingAdminEdit} onClick={async () => { setSavingAdminEdit(true); await saveAdminEdit(); setSavingAdminEdit(false); }} className="flex-1 py-2.5 rounded-xl bg-[#3BC25B] text-white text-sm font-semibold hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {savingAdminEdit ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <>Save Changes</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete Confirmation Modal (Admin) ── */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Delete Ticket</h3>
                  <p className="text-gray-400 dark:text-white/40 text-xs">This action cannot be undone.</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 dark:text-gray-300">Are you sure you want to permanently delete ticket <span className="font-mono text-xs text-[#0E8F79]">{ticket.id}</span>?</p>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium transition-all">Cancel</button>
              <button type="button" disabled={deletingAdmin} onClick={confirmAdminDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {deletingAdmin ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</> : <>Delete Ticket</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Image Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}

      {/* ── CSAT Rating Modal (Admin – before closing) ── */}
      {showCsatModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Rate Technical Performance</h3>
                  <p className="text-gray-400 dark:text-white/40 text-xs">Submit CSAT before closing this ticket</p>
                </div>
              </div>
              <button onClick={() => setShowCsatModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Employee info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#0E8F79] flex items-center justify-center text-white font-bold text-sm">
                  {getAssigneeName(btData!)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{getAssigneeName(btData!) || 'Technical'}</p>
                  <p className="text-xs text-gray-400">Assigned Technical</p>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-3 uppercase tracking-wider">Rating</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCsatRating(s)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 transition-colors ${s <= csatRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`} />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-1.5">
                  {csatRating === 0 ? 'Click a star to rate' : csatRating <= 2 ? 'Needs Improvement' : csatRating <= 3 ? 'Satisfactory' : csatRating <= 4 ? 'Good' : 'Excellent'}
                </p>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-1.5 uppercase tracking-wider">Comments (Optional)</label>
                <textarea
                  value={csatComments}
                  onChange={(e) => setCsatComments(e.target.value)}
                  rows={3}
                  placeholder="Additional feedback about the technical's performance..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:border-yellow-500/60 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => { setShowCsatModal(false); setCsatRating(0); setCsatComments(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingCsat || csatRating < 1}
                onClick={handleCsatClose}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {submittingCsat ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                ) : (
                  <><Star className="w-3.5 h-3.5" /> Submit & Close</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Escalate Ticket Modal ── */}
      {showEscalateModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Escalate Ticket</h3>
                  <p className="text-gray-400 dark:text-white/40 text-xs">Route this ticket for higher-level support</p>
                </div>
              </div>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Escalation Type */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-2 uppercase tracking-wider">Escalation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEscalateType('internal'); setEscalateToErr(''); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      escalateType === 'internal'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 dark:text-orange-400'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Internal
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscalateType('external')}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      escalateType === 'external'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 dark:text-orange-400'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    External
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-white/30">
                  {escalateType === 'internal'
                    ? 'Escalate to a supervisor for reassignment.'
                    : 'Escalate to an external distributor or vendor.'}
                </p>
              </div>

              {/* External: Distributor/Vendor field */}
              {escalateType === 'external' && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-1.5 uppercase tracking-wider">
                    Distributor / Vendor Name <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={escalateTo}
                    onChange={e => { setEscalateTo(e.target.value); if (escalateToErr) setEscalateToErr(''); }}
                    placeholder="e.g. Acme Distributors"
                    className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border text-gray-900 dark:text-white text-sm placeholder-gray-300 dark:placeholder-white/20 focus:outline-none transition-colors ${
                      escalateToErr ? 'border-red-500/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-orange-500/60'
                    }`}
                  />
                  {escalateToErr && <p className="mt-1 text-xs text-red-400">{escalateToErr}</p>}
                </div>
              )}

              {/* Notes / Reason */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-white/50 font-medium mb-1.5 uppercase tracking-wider">
                  Notes / Reason <span className="text-orange-400">*</span>
                </label>
                <textarea
                  value={escalateNotes}
                  onChange={e => { setEscalateNotes(e.target.value); if (escalateNotesErr) setEscalateNotesErr(''); }}
                  rows={3}
                  placeholder="Describe why this ticket cannot be resolved at your level…"
                  className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border text-gray-900 dark:text-white text-sm placeholder-gray-300 dark:placeholder-white/20 focus:outline-none resize-none transition-colors ${
                    escalateNotesErr ? 'border-red-500/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-orange-500/60'
                  }`}
                />
                {escalateNotesErr && <p className="mt-1 text-xs text-red-400">{escalateNotesErr}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => {
                  setShowEscalateModal(false);
                  setEscalateNotes('');
                  setEscalateTo('');
                  setEscalateNotesErr('');
                  setEscalateToErr('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingEscalation}
                onClick={handleEscalateTicket}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {submittingEscalation ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Escalating…</>
                ) : (
                  <><ArrowUpRight className="w-3.5 h-3.5" /> Submit Escalation</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </>
      )}
    </div>
  );
}

export default TicketView;

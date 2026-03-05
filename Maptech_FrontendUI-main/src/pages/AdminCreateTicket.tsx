import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { toast } from 'sonner';
import {
  validateEmail,
  validatePhone,
  validateLandline,
  validateAddress,
  validateDescription,
  validateName,
  MAX_EMAIL,
  MAX_PHONE,
  MAX_ADDRESS,
  MAX_DESCRIPTION,
  MAX_FIELD,
} from '../utils/validation';
import {
  Calendar,
  Clock,
  FileText,
  Monitor,
  Wrench,
  Server,
  Search,
  Phone,
  PhoneOff,
  Pause,
  Play,
  UserCheck,
  CheckCircle2,
  Loader2,
  X,
  Cpu,
  HardDrive,
  Settings,
  Wifi,
  Shield,
  Package,
  Cog,
  ExternalLink,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import {
  createTicket,
  assignTicket,
  fetchEmployees,
  fetchTypesOfService,
  fetchClients,
  fetchProducts,
  fetchTickets,
  createCallLog,
  endCallLog,
  linkTickets,
} from '../services/api';
import type { TypeOfService as ServiceType, ClientRecord, Product, BackendTicket } from '../services/api';

/** Pick an icon for a service type based on keyword matching in its name. */
function getServiceIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes('demo') || lower.includes('poc'))        return Monitor;
  if (lower.includes('ocular') || lower.includes('inspect'))  return Search;
  if (lower.includes('install'))                               return Wrench;
  if (lower.includes('repair') || lower.includes('service'))  return Wrench;
  if (lower.includes('migration') || lower.includes('hci'))   return Server;
  if (lower.includes('network') || lower.includes('wifi'))    return Wifi;
  if (lower.includes('security') || lower.includes('shield')) return Shield;
  if (lower.includes('hardware') || lower.includes('device')) return HardDrive;
  if (lower.includes('software') || lower.includes('app'))    return Cpu;
  if (lower.includes('maintenance'))                           return Settings;
  if (lower.includes('deploy') || lower.includes('package'))  return Package;
  if (lower.includes('config'))                                return Cog;
  return Wrench;
}

const CONTACT_FIELDS = [
  { name: 'client', label: 'Client', placeholder: 'e.g. Maptech Inc.', required: true },
  { name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Juan Dela Cruz', required: true },
  { name: 'landline', label: 'Landline No.', placeholder: 'e.g. (02) 1234-5678', required: false },
  { name: 'mobile', label: 'Mobile No.', placeholder: 'e.g. 09171234567', required: true },
  { name: 'designation', label: 'Designation', placeholder: 'e.g. IT Manager', required: true },
  { name: 'department', label: 'Department / Organization', placeholder: 'e.g. Information Technology', required: true },
] as const;

/* Flow: form → stf-details (with Call Client + Priority) → ongoing → stf-details (priority enabled) → assign employee → redirect */
type ModalStep = 'none' | 'stf-details' | 'ongoing' | 'assign';

export function AdminCreateTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkedTicketId = searchParams.get('linkedTicketId') ? Number(searchParams.get('linkedTicketId')) : null;
  const linkedStf = searchParams.get('linkedStf') || null;

  const getStfNo = () => {
    const d = new Date();
    const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const suffix = String(Math.floor(Math.random() * 900000) + 100000);
    return `STF-MT-${yyyymmdd}${suffix}`;
  };

  const [stfNo] = useState(getStfNo);
  const [contactValues, setContactValues] = useState<Record<string, string>>({
    client: '', contactPerson: '', landline: '', mobile: '', designation: '', department: '',
  });
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceOthersText, setServiceOthersText] = useState('');
  const [supportType, setSupportType] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [errorMsgs, setErrorMsgs] = useState<Record<string, string>>({});

  // Modal state
  const [modalStep, setModalStep] = useState<ModalStep>('none');
  const [priorityLevel, setPriorityLevel] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Data from backend
  const [employees, setEmployees] = useState<{ id: number; name: string; role: string; avatar: string; available: boolean; activeTickets: number }[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  // New/existing client toggle
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [existingClients, setExistingClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Product picker
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Estimated resolution days override (for "Others")
  const [estimatedDaysOverride, setEstimatedDaysOverride] = useState<number | ''>('');

  // Call timer state
  const [callLogId, setCallLogId] = useState<number | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callCompleted, setCallCompleted] = useState(false);
  const [callOnHold, setCallOnHold] = useState(false);
  const [holdOffset, setHoldOffset] = useState(0); // accumulated hold time in ms
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null); // when hold started (ms)
  const [isAssigning, setIsAssigning] = useState(false);

  // Employee working tickets (for expanded assign modal)
  const [employeeTickets, setEmployeeTickets] = useState<Record<number, BackendTicket[]>>({});

  // Fetch employees, service types, clients, and products from backend
  useEffect(() => {
    fetchEmployees()
      .then((emps) => {
        setEmployees(
          emps.map((e: any) => ({
            id: e.id,
            name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.username,
            role: e.role || 'Technical',
            avatar: `${(e.first_name || 'E')[0]}${(e.last_name || '')[0] || ''}`.toUpperCase(),
            available: e.is_active !== false,
            activeTickets: e.active_ticket_count ?? 0,
          }))
        );
      })
      .catch(() => {});
    fetchTypesOfService()
      .then((types) => setServiceTypes(types))
      .catch(() => {});
    fetchClients()
      .then((c) => setExistingClients(c))
      .catch(() => {});
    fetchProducts()
      .then((p) => setProducts(p))
      .catch(() => {});
  }, []);

  const setContactField = (name: string, value: string) => {
    setContactValues((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  // When selecting an existing client, auto-fill contact fields
  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
    const client = existingClients.find((c) => c.id === clientId);
    if (client) {
      setContactValues({
        client: client.client_name,
        contactPerson: client.contact_person || '',
        landline: client.landline || '',
        mobile: client.mobile_no || '',
        designation: client.designation || '',
        department: client.department_organization || '',
      });
      setEmail(client.email_address || '');
      setAddress(client.address || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    const msgs: Record<string, string> = {};

    CONTACT_FIELDS.forEach((f) => {
      if (f.name === 'mobile') {
        const err = validatePhone(contactValues[f.name] || '', 'Mobile No.');
        if (err) { newErrors[f.name] = true; msgs[f.name] = err; }
      } else if (f.name === 'landline') {
        const err = validateLandline(contactValues[f.name] || '');
        if (err) { newErrors[f.name] = true; msgs[f.name] = err; }
      } else if (f.name === 'contactPerson') {
        const err = validateName(contactValues[f.name] || '', 'Contact Person');
        if (err) { newErrors[f.name] = true; msgs[f.name] = err; }
      } else if (f.required && !contactValues[f.name]?.trim()) {
        newErrors[f.name] = true;
        msgs[f.name] = `${f.label} is required.`;
      }
    });

    if (email.trim()) {
      const emailErr = validateEmail(email);
      if (emailErr) { newErrors['email'] = true; msgs['email'] = emailErr; }
    }

    const addrErr = validateAddress(address);
    if (addrErr) { newErrors['address'] = true; msgs['address'] = addrErr; }

    if (!serviceType) newErrors['serviceType'] = true;
    if (serviceType === 'Others' && !serviceOthersText.trim()) newErrors['serviceOthersText'] = true;
    if (!supportType) newErrors['supportType'] = true;

    const descErr = validateDescription(description, 'Description of problem');
    if (descErr) { newErrors['description'] = true; msgs['description'] = descErr; }

    setErrors(newErrors);
    setErrorMsgs(msgs);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted errors.');
      return;
    }
    // Show STF details modal for review, call, and priority
    setModalStep('stf-details');
    setCallCompleted(false);
    setPriorityLevel('');
  };

  // Real call timer (tracks duration when in "ongoing" step, pauses when on hold)
  useEffect(() => {
    if (modalStep !== 'ongoing' || callOnHold) return;
    const interval = setInterval(() => {
      if (callStartTime) {
        setCallTimer(Math.floor((Date.now() - callStartTime.getTime() - holdOffset) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [modalStep, callStartTime, callOnHold, holdOffset]);

  const formatCallDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  /** Start call from the STF details modal */
  const handleStartCall = async () => {
    setModalStep('ongoing');
    setCallTimer(0);
    setCallOnHold(false);
    setHoldOffset(0);
    try {
      const log = await createCallLog({
        client_name: contactValues.client,
        phone_number: contactValues.mobile,
        call_start: new Date().toISOString(),
      });
      setCallLogId(log.id);
      setCallStartTime(new Date());
    } catch {
      setCallStartTime(new Date());
    }
  };

  const handleEndCall = useCallback(async () => {
    // End the call log
    if (callLogId) {
      try {
        await endCallLog(callLogId, { call_end: new Date().toISOString() });
      } catch {
        // Continue even if endCallLog fails
      }
    }
    setCallCompleted(true);
    setCallOnHold(false);
    setModalStep('stf-details'); // Go back to STF details with priority enabled
  }, [callLogId]);

  const handleConfirmPriority = () => {
    if (!priorityLevel) {
      toast.error('Please select a priority level.');
      return;
    }
    // Fetch all tickets so we can show each employee's working tickets
    fetchTickets()
      .then((allTickets) => {
        const grouped: Record<number, BackendTicket[]> = {};
        for (const t of allTickets) {
          if (t.assigned_to && t.status !== 'closed' && t.status !== 'resolved') {
            const empId = t.assigned_to.id;
            if (!grouped[empId]) grouped[empId] = [];
            grouped[empId].push(t);
          }
        }
        setEmployeeTickets(grouped);
      })
      .catch(() => {});
    setModalStep('assign');
    setSelectedEmployee(null);
  };

  const handleAssign = async () => {
    if (!selectedEmployee) {
      toast.error('Please select a technical to assign.');
      return;
    }
    if (isAssigning) return;
    setIsAssigning(true);
    const emp = employees.find((e) => e.id === selectedEmployee);

    // Map support type label to backend value
    const supportTypeMap: Record<string, string> = {
      'Remote / Online': 'remote_online',
      'Remote/Online': 'remote_online',
      'Onsite': 'onsite',
      'Chat': 'chat',
      'Call': 'call',
    };

    // Find the service type ID from the backend
    const matchedService = serviceTypes.find((s) => s.name === serviceType);

    try {
      const ticketData: Record<string, unknown> = {
        client: contactValues.client,
        contact_person: contactValues.contactPerson,
        landline: contactValues.landline,
        mobile_no: contactValues.mobile,
        designation: contactValues.designation,
        department_organization: contactValues.department,
        email_address: email.trim(),
        address,
        description_of_problem: description,
        preferred_support_type: supportTypeMap[supportType?.trim()] || 'remote_online',
        priority: priorityLevel.toLowerCase(),
      };

      if (matchedService) {
        ticketData.type_of_service = matchedService.id;
      } else if (serviceType === 'Others') {
        ticketData.type_of_service_others = serviceOthersText;
        if (estimatedDaysOverride && Number(estimatedDaysOverride) > 0) {
          ticketData.estimated_resolution_days_override = Number(estimatedDaysOverride);
        }
      } else if (serviceType) {
        ticketData.type_of_service_others = serviceType;
      }

      // Existing client / product linkage
      if (isExistingClient && selectedClientId) {
        ticketData.client_record = selectedClientId;
        ticketData.is_existing_client = true;
      }
      if (selectedProductId) {
        ticketData.product_record = selectedProductId;
      }

      const created = await createTicket(ticketData as any);
      await assignTicket(created.id, selectedEmployee);

      // Link to original ticket if this was triggered from "Link Ticket / Same Problem"
      if (linkedTicketId) {
        try {
          await linkTickets(linkedTicketId, [created.id]);
        } catch { /* linking is best-effort */ }
      }

      setModalStep('none');
      toast.success(`Ticket ${created.stf_no} assigned to ${emp?.name}`, {
        description: linkedStf
          ? `Linked to ${linkedStf} | Priority: ${priorityLevel} | Service: ${serviceType}`
          : `Priority: ${priorityLevel} | Service: ${serviceType}`,
      });
      navigate(`/admin/ticket-details?stf=${encodeURIComponent(created.stf_no)}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create ticket.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignExternal = async () => {
    if (isAssigning) return;
    setIsAssigning(true);

    const supportTypeMap: Record<string, string> = {
      'Remote / Online': 'remote_online',
      'Remote/Online': 'remote_online',
      'Onsite': 'onsite',
      'Chat': 'chat',
      'Call': 'call',
    };
    const matchedService = serviceTypes.find((s) => s.name === serviceType);

    try {
      const ticketData: Record<string, unknown> = {
        client: contactValues.client,
        contact_person: contactValues.contactPerson,
        landline: contactValues.landline,
        mobile_no: contactValues.mobile,
        designation: contactValues.designation,
        department_organization: contactValues.department,
        email_address: email.trim(),
        address,
        description_of_problem: description,
        preferred_support_type: supportTypeMap[supportType?.trim()] || 'remote_online',
        priority: priorityLevel.toLowerCase(),
      };

      if (matchedService) {
        ticketData.type_of_service = matchedService.id;
      } else if (serviceType === 'Others') {
        ticketData.type_of_service_others = serviceOthersText;
        if (estimatedDaysOverride && Number(estimatedDaysOverride) > 0) {
          ticketData.estimated_resolution_days_override = Number(estimatedDaysOverride);
        }
      } else if (serviceType) {
        ticketData.type_of_service_others = serviceType;
      }

      if (isExistingClient && selectedClientId) {
        ticketData.client_record = selectedClientId;
        ticketData.is_existing_client = true;
      }
      if (selectedProductId) {
        ticketData.product_record = selectedProductId;
      }

      const created = await createTicket(ticketData as any);

      // Link to original ticket if this was triggered from "Link Ticket / Same Problem"
      if (linkedTicketId) {
        try {
          await linkTickets(linkedTicketId, [created.id]);
        } catch { /* linking is best-effort */ }
      }

      setModalStep('none');
      toast.success(`Ticket ${created.stf_no} created for external assignment`, {
        description: linkedStf
          ? `Linked to ${linkedStf} | Priority: ${priorityLevel} | Service: ${serviceType}`
          : `Priority: ${priorityLevel} | Service: ${serviceType}`,
      });
      navigate(`/admin/ticket-details?stf=${encodeURIComponent(created.stf_no)}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create ticket.');
    } finally {
      setIsAssigning(false);
    }
  };

  const errorRing = 'ring-2 ring-red-400 border-red-400';
  const inputCls = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1';
  const sectionHeaderCls = 'text-sm font-bold text-[#0E8F79] dark:text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 dark:border-gray-700';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">SERVICE TICKET FORM</h1>
        <p className="text-[#0E8F79] dark:text-green-400 font-medium mt-1">Maptech Information Solutions Inc.</p>

        {/* Linked ticket notification banner */}
        {linkedStf && (
          <div className="mt-4 mx-auto max-w-2xl flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-sm">
            <Link2 className="w-5 h-5 flex-shrink-0" />
            <span>
              This ticket will be <strong>linked</strong> to <strong>{linkedStf}</strong> as a related / same-problem ticket.
            </span>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
          {[
            { icon: Calendar, label: 'Date', value: new Date().toLocaleDateString() },
            { icon: FileText, label: 'STF No.', value: stfNo },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#3BC25B]" />
              <span className="font-semibold">{label}:</span> {value}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Contact Info */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>1. Contact Information</h3>

          {/* New / Existing client toggle */}
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => { setIsExistingClient(false); setSelectedClientId(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                !isExistingClient
                  ? 'bg-[#0E8F79] text-white border-[#0E8F79]'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              New Client
            </button>
            <button
              type="button"
              onClick={() => setIsExistingClient(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isExistingClient
                  ? 'bg-[#0E8F79] text-white border-[#0E8F79]'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              Existing Client
            </button>
          </div>

          {/* Existing client dropdown */}
          {isExistingClient && (
            <div className="mb-6">
              <label className={labelCls}>Select Existing Client <span className="text-red-500 ml-1">*</span></label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => handleClientSelect(Number(e.target.value))}
                className={`${inputCls}`}
              >
                <option value="">— Select a client —</option>
                {existingClients.filter((c) => c.is_active).map((c) => (
                  <option key={c.id} value={c.id}>{c.client_name} {c.contact_person ? `(${c.contact_person})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTACT_FIELDS.map((f) => (
              <div key={f.name}>
                <label className={labelCls}>{f.label} {f.required && <span className="text-red-500 ml-1">*</span>}</label>
                <input type="text" placeholder={f.placeholder} value={contactValues[f.name]} onChange={(e) => { const val = e.target.value; if (f.name === 'mobile' && val !== '' && !/^\d*$/.test(val)) return; if (f.name === 'landline' && val !== '' && !/^[\d()\-\s]*$/.test(val)) return; setContactField(f.name, val); }} maxLength={f.name === 'mobile' ? 11 : f.name === 'landline' ? MAX_PHONE : MAX_FIELD} className={`${inputCls} ${errors[f.name] ? errorRing : ''}`} />
                {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errorMsgs[f.name] || 'This field is required'}</p>}
              </div>
            ))}
            <div>
              <label className={labelCls}>Email Address <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
              <input type="text" placeholder="e.g. juandelacruz@email.com" value={email} maxLength={MAX_EMAIL} onChange={(e) => { setEmail(e.target.value); if (e.target.value.trim()) { setErrors((p) => ({ ...p, email: false })); setErrorMsgs((p) => ({ ...p, email: '' })); } }} className={`${inputCls} ${errors['email'] ? errorRing : ''}`} />
              {errors['email'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['email'] || 'This field is required'}</p>}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Full Address <span className="text-red-500 ml-1">*</span></label>
              <textarea rows={2} placeholder="e.g. 123 Main Street, Quezon City, Metro Manila" value={address} maxLength={MAX_ADDRESS} onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) { setErrors((p) => ({ ...p, address: false })); setErrorMsgs((p) => ({ ...p, address: '' })); } }} className={`${inputCls} resize-none ${errors['address'] ? errorRing : ''}`} />
              {errors['address'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['address'] || 'This field is required'}</p>}
            </div>
          </div>
        </Card>

        {/* Section 2: Type of Service */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>2. Type of Service <span className="text-red-500 ml-1">*</span></h3>
          {errors['serviceType'] && <p className="text-red-500 text-xs mb-3 -mt-4">Please select a type of service</p>}
          {serviceTypes.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Loading service types...</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceTypes.filter((s) => s.is_active).map((svc) => {
              const Icon = getServiceIcon(svc.name);
              const isSelected = serviceType === svc.name;
              return (
                <div key={svc.id} onClick={() => { setServiceType((prev) => prev === svc.name ? '' : svc.name); setErrors((p) => ({ ...p, serviceType: false })); }} className={`group cursor-pointer p-4 rounded-lg border transition-all flex items-center gap-3 ${isSelected ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <div className={`p-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-[#3BC25B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${isSelected ? 'text-[#0E8F79] dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>{svc.name}</span>
                    {svc.description && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 block overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-20 group-hover:mt-1 opacity-0 group-hover:opacity-100">{svc.description}</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div onClick={() => { setServiceType((prev) => prev === 'Others' ? '' : 'Others'); setErrors((p) => ({ ...p, serviceType: false })); }} className={`cursor-pointer p-4 rounded-lg border transition-all flex flex-col gap-2 ${serviceType === 'Others' ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${serviceType === 'Others' ? 'bg-[#3BC25B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}><FileText className="w-4 h-4" /></div>
                <span className={`text-sm font-medium ${serviceType === 'Others' ? 'text-[#0E8F79] dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Others</span>
              </div>
              {serviceType === 'Others' && (
                <div onClick={(e) => e.stopPropagation()}>
                  <input type="text" placeholder="Please specify the service..." value={serviceOthersText} onChange={(e) => { setServiceOthersText(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, serviceOthersText: false })); }} className={`mt-1 w-full text-sm border-b ${errors['serviceOthersText'] ? 'border-red-400' : 'border-[#3BC25B]'} bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none`} autoFocus />
                  {errors['serviceOthersText'] && <p className="text-red-500 text-xs mt-1">Please specify the service</p>}
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Est. Resolution Days</label>
                    <input type="number" min={1} placeholder="e.g. 5" value={estimatedDaysOverride} onChange={(e) => setEstimatedDaysOverride(e.target.value ? parseInt(e.target.value) : '')} className="mt-1 w-full text-sm border-b border-[#3BC25B] bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none" />
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Show estimated resolution days for the selected service */}
          {serviceType && serviceType !== 'Others' && (() => {
            const selected = serviceTypes.find((s) => s.name === serviceType);
            return selected && selected.estimated_resolution_days > 0 ? (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Estimated Resolution: <span className="font-bold">{selected.estimated_resolution_days} day{selected.estimated_resolution_days !== 1 ? 's' : ''}</span>
                </span>
              </div>
            ) : null;
          })()}
        </Card>

        {/* Section 3: Support Type */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>3. Preferred Type of Support <span className="text-red-500 ml-1">*</span></h3>
          {errors['supportType'] && <p className="text-red-500 text-xs mb-3 -mt-4">Please select a support type</p>}
          <div className="flex flex-wrap gap-4">
            {['Remote / Online', 'Onsite', 'Chat', 'Call'].map((type) => (
              <button key={type} type="button" onClick={() => { setSupportType((prev) => prev === type ? '' : type); setErrors((p) => ({ ...p, supportType: false })); }} className={`px-6 py-3 rounded-full text-sm font-medium transition-all border ${supportType === type ? 'bg-[#0E8F79] text-white border-[#0E8F79] shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>{type}</button>
            ))}
          </div>
        </Card>

        {/* Section 4: Description */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>4. Description of Problem <span className="text-red-500 ml-1">*</span></h3>
          <textarea rows={8} value={description} maxLength={MAX_DESCRIPTION} onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) { setErrors((p) => ({ ...p, description: false })); setErrorMsgs((p) => ({ ...p, description: '' })); } }} className={`${inputCls} resize-none ${errors['description'] ? errorRing : ''}`} placeholder="Please describe the problem in detail. Include any error messages, steps to reproduce, and when the issue started..." />
          <div className="flex justify-between mt-1">
            {errors['description'] ? <p className="text-red-500 text-xs">{errorMsgs['description'] || 'This field is required'}</p> : <span />}
            <span className="text-xs text-gray-400">{description.length}/{MAX_DESCRIPTION}</span>
          </div>
        </Card>

        <div className="pt-4">
          <GreenButton fullWidth className="py-4 text-lg shadow-lg shadow-green-500/20">Submit Service Ticket</GreenButton>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">By submitting, you agree to our support terms and conditions.</p>
        </div>
      </form>

      {/* Modal Flow: calling → ongoing → priority → assign */}
      {modalStep !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          {/* ── Step 1: STF Details Review ── */}
          {modalStep === 'stf-details' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">STF Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review the ticket before proceeding</p>
                  </div>
                  <button onClick={() => setModalStep('none')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                {/* Summary card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm mb-5 max-h-60 overflow-y-auto">
                  {[
                    ['STF No.', stfNo],
                    ['Client', contactValues.client],
                    ['Contact Person', contactValues.contactPerson],
                    ['Mobile', contactValues.mobile],
                    ['Landline', contactValues.landline || '—'],
                    ['Email', email],
                    ['Designation', contactValues.designation],
                    ['Department', contactValues.department],
                    ['Address', address],
                    ['Type of Service', serviceType === 'Others' ? `Others — ${serviceOthersText}` : serviceType],
                    ['Support Type', supportType],
                    ['Description', description],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-gray-500 dark:text-gray-400 w-32 shrink-0 font-medium">{label}:</span>
                      <span className="text-gray-900 dark:text-white break-words">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Call Client button */}
                <button
                  onClick={handleStartCall}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors mb-5 ${callCompleted ? 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400 cursor-default' : 'bg-[#3BC25B] hover:bg-[#2ea34a] text-white'}`}
                  disabled={callCompleted}
                >
                  {callCompleted ? (
                    <><CheckCircle2 className="w-4 h-4" /> Call Completed</>
                  ) : (
                    <><Phone className="w-4 h-4" /> Call Client</>
                  )}
                </button>

                {/* Priority selector */}
                <div className={`${!callCompleted ? 'opacity-40 pointer-events-none' : ''}`}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority Level {!callCompleted && <span className="text-xs font-normal text-gray-400 ml-1">(complete a call first)</span>}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Low', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300', active: 'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700' },
                      { label: 'Medium', color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300', active: 'bg-yellow-500 text-white border-yellow-500 ring-2 ring-yellow-300 dark:ring-yellow-700' },
                      { label: 'High', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300', active: 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700' },
                      { label: 'Critical', color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300', active: 'bg-red-500 text-white border-red-500 ring-2 ring-red-300 dark:ring-red-700' },
                    ].map(({ label, color, active }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setPriorityLevel(label)}
                        className={`px-2 py-3 rounded-xl border-2 text-xs font-bold transition-all ${priorityLevel === label ? active : `${color} hover:opacity-80`}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue to Assign */}
                <div className="mt-5">
                  <button
                    onClick={handleConfirmPriority}
                    disabled={!callCompleted || !priorityLevel}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue to Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Ongoing Call with Real Timer ── */}
          {modalStep === 'ongoing' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-10 h-10 text-white animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Call Connected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-2">{contactValues.contactPerson || 'Client'} — {contactValues.mobile || 'N/A'}</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${callOnHold ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${callOnHold ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} /> {callOnHold ? 'On Hold' : 'Ongoing Call'}
                </div>
                <div className={`text-3xl font-bold mb-6 tabular-nums font-mono ${callOnHold ? 'text-yellow-500' : 'text-[#3BC25B]'}`}>
                  {formatCallDuration(callTimer)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (callOnHold) {
                        // Resuming: add the hold duration to offset
                        if (holdStartTime) {
                          setHoldOffset((prev) => prev + (Date.now() - holdStartTime));
                        }
                        setHoldStartTime(null);
                        setCallOnHold(false);
                      } else {
                        // Going on hold
                        setHoldStartTime(Date.now());
                        setCallOnHold(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors shadow-lg ${
                      callOnHold
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/30'
                    }`}
                  >
                    {callOnHold ? <><Play className="w-5 h-5" /> Resume</> : <><Pause className="w-5 h-5" /> On Hold</>}
                  </button>
                  <button onClick={handleEndCall} className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors shadow-lg shadow-red-500/30">
                    <PhoneOff className="w-5 h-5" /> End Call
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Assign Employee (expanded with working tickets) ── */}
          {modalStep === 'assign' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assign Technical</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a technical to handle this ticket</p>
                  </div>
                  <button onClick={() => setModalStep('stf-details')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                {/* Ticket + Priority summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Ticket: </span>
                    <span className="font-bold text-gray-900 dark:text-white">{stfNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Priority: </span>
                    <span className={`font-semibold ${priorityLevel === 'Critical' ? 'text-red-600' : priorityLevel === 'High' ? 'text-orange-600' : priorityLevel === 'Medium' ? 'text-yellow-600' : 'text-blue-600'}`}>{priorityLevel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Service: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{serviceType === 'Others' ? serviceOthersText : serviceType}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 italic">Sorted by fewest active tickets</p>

                {/* Employee list */}
                <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
                  {employees.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No technicals found.</p>
                  )}
                  {[...employees].sort((a, b) => a.activeTickets - b.activeTickets).map((emp) => {
                    const tickets = employeeTickets[emp.id] || [];
                    const isSelected = selectedEmployee === emp.id;
                    return (
                      <div key={emp.id} className={`rounded-xl border-2 transition-all ${isSelected ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : emp.available ? 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B]' : 'border-gray-100 dark:border-gray-700 opacity-50'}`}>
                        {/* Employee header row */}
                        <button
                          type="button"
                          onClick={() => emp.available && setSelectedEmployee(isSelected ? null : emp.id)}
                          disabled={!emp.available}
                          className="w-full flex items-center gap-3 p-3 text-left"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-[#3BC25B] text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                            {emp.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{emp.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${emp.activeTickets === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : emp.activeTickets <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {emp.activeTickets} active
                          </span>
                          {!emp.available && <span className="text-xs text-red-400 font-medium shrink-0">Unavailable</span>}
                          {emp.available && isSelected && <CheckCircle2 className="w-5 h-5 text-[#3BC25B] shrink-0" />}
                          {emp.available && !isSelected && <div className="w-2 h-2 bg-green-400 rounded-full shrink-0" title="Available" />}
                        </button>

                        {/* Working tickets (always visible when there are tickets) */}
                        {tickets.length > 0 && (
                          <div className="px-3 pb-3">
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Current Working Tickets</p>
                            <div className="space-y-1.5">
                              {tickets.map((t) => (
                                <div key={t.id} className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-600">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{t.stf_no}</div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t.type_of_service_detail?.name || 'N/A'}</div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${t.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                    {(t.status || '').replace(/_/g, ' ')}
                                  </span>
                                  <div className="w-20 shrink-0">
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                      <span>Progress</span>
                                      <span className="font-bold">{t.progress_percentage ?? 0}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#3BC25B] rounded-full transition-all" style={{ width: `${t.progress_percentage ?? 0}%` }} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-3">
                  <button onClick={handleAssign} disabled={!selectedEmployee || isAssigning} className="w-full px-4 py-2.5 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    {isAssigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : <><UserCheck className="w-4 h-4" /> Assign Ticket</>}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <button onClick={handleAssignExternal} disabled={isAssigning} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    {isAssigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><ExternalLink className="w-4 h-4" /> Assign to External</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

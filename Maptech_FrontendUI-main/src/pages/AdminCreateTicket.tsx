import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { toast } from 'sonner';
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
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

const CONTACT_FIELDS = [
  { name: 'client', label: 'Client', placeholder: 'e.g. Maptech Inc.', required: true },
  { name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Juan Dela Cruz', required: true },
  { name: 'landline', label: 'Landline No.', placeholder: 'e.g. (02) 1234-5678', required: false },
  { name: 'mobile', label: 'Mobile No.', placeholder: 'e.g. 09171234567', required: true },
  { name: 'designation', label: 'Designation', placeholder: 'e.g. IT Manager', required: true },
  { name: 'department', label: 'Department / Organization', placeholder: 'e.g. Information Technology', required: true },
] as const;

const EMPLOYEES = [
  { id: 1, name: 'John Doe', role: 'Network Engineer', avatar: 'JD', available: true },
  { id: 2, name: 'Sarah Miller', role: 'Systems Admin', avatar: 'SM', available: true },
  { id: 3, name: 'Mike Reyes', role: 'Field Technician', avatar: 'MR', available: false },
  { id: 4, name: 'Jenny Lopez', role: 'Help Desk Agent', avatar: 'JL', available: true },
  { id: 5, name: 'Carlos Santos', role: 'Senior Engineer', avatar: 'CS', available: true },
];

/* Flow: form → calling (5s countdown) → ongoing call → end call → priority modal → assign employee */
type ModalStep = 'none' | 'calling' | 'ongoing' | 'priority' | 'assign';

export function AdminCreateTicket() {
  const navigate = useNavigate();

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

  // Modal state
  const [modalStep, setModalStep] = useState<ModalStep>('none');
  const [countdown, setCountdown] = useState(5);
  const [priorityLevel, setPriorityLevel] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  const setContactField = (name: string, value: string) => {
    setContactValues((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    CONTACT_FIELDS.forEach((f) => {
      if (f.required && !contactValues[f.name]?.trim()) newErrors[f.name] = true;
    });
    if (!email.trim()) newErrors['email'] = true;
    if (!address.trim()) newErrors['address'] = true;
    if (!serviceType) newErrors['serviceType'] = true;
    if (serviceType === 'Others' && !serviceOthersText.trim()) newErrors['serviceOthersText'] = true;
    if (!supportType) newErrors['supportType'] = true;
    if (!description.trim()) newErrors['description'] = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill up all required fields.');
      return;
    }
    // Start call flow
    setModalStep('calling');
    setCountdown(5);
  };

  // Countdown timer
  useEffect(() => {
    if (modalStep !== 'calling') return;
    if (countdown <= 0) {
      setModalStep('ongoing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [modalStep, countdown]);

  const handleEndCall = useCallback(() => {
    setModalStep('priority');
    setPriorityLevel('');
  }, []);

  const handleConfirmPriority = () => {
    if (!priorityLevel) {
      toast.error('Please select a priority level.');
      return;
    }
    setModalStep('assign');
    setSelectedEmployee(null);
  };

  const handleAssign = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee to assign.');
      return;
    }
    const emp = EMPLOYEES.find((e) => e.id === selectedEmployee);
    setModalStep('none');
    toast.success(`Ticket ${stfNo} assigned to ${emp?.name}`, {
      description: `Priority: ${priorityLevel} | Service: ${serviceType}`,
    });
    navigate('/admin/dashboard');
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
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
          {[
            { icon: Calendar, label: 'Date', value: new Date().toLocaleDateString() },
            { icon: FileText, label: 'STF No.', value: stfNo },
            { icon: Clock, label: 'Time In', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTACT_FIELDS.map((f) => (
              <div key={f.name}>
                <label className={labelCls}>{f.label} {f.required && <span className="text-red-500 ml-1">*</span>}</label>
                <input type="text" placeholder={f.placeholder} value={contactValues[f.name]} onChange={(e) => setContactField(f.name, e.target.value)} className={`${inputCls} ${errors[f.name] ? errorRing : ''}`} />
                {errors[f.name] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              </div>
            ))}
            <div>
              <label className={labelCls}>Email Address <span className="text-red-500 ml-1">*</span></label>
              <input type="email" placeholder="e.g. juandelacruz@email.com" value={email} onChange={(e) => { setEmail(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, email: false })); }} className={`${inputCls} ${errors['email'] ? errorRing : ''}`} />
              {errors['email'] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Full Address <span className="text-red-500 ml-1">*</span></label>
              <textarea rows={2} placeholder="e.g. 123 Main Street, Quezon City, Metro Manila" value={address} onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, address: false })); }} className={`${inputCls} resize-none ${errors['address'] ? errorRing : ''}`} />
              {errors['address'] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
          </div>
        </Card>

        {/* Section 2: Type of Service */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>2. Type of Service <span className="text-red-500 ml-1">*</span></h3>
          {errors['serviceType'] && <p className="text-red-500 text-xs mb-3 -mt-4">Please select a type of service</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Demo / POC', icon: Monitor },
              { label: 'Ocular Inspection', icon: Search },
              { label: 'Installation', icon: Wrench },
              { label: 'Repair / Service', icon: Wrench },
              { label: 'Migration to HCI', icon: Server },
            ].map(({ label, icon: Icon }) => (
              <div key={label} onClick={() => { setServiceType((prev) => prev === label ? '' : label); setErrors((p) => ({ ...p, serviceType: false })); }} className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center gap-3 ${serviceType === label ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <div className={`p-2 rounded-full ${serviceType === label ? 'bg-[#3BC25B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}><Icon className="w-4 h-4" /></div>
                <span className={`text-sm font-medium ${serviceType === label ? 'text-[#0E8F79] dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
              </div>
            ))}
            <div onClick={() => { setServiceType((prev) => prev === 'Others' ? '' : 'Others'); setErrors((p) => ({ ...p, serviceType: false })); }} className={`cursor-pointer p-4 rounded-lg border transition-all flex flex-col gap-2 ${serviceType === 'Others' ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${serviceType === 'Others' ? 'bg-[#3BC25B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}><FileText className="w-4 h-4" /></div>
                <span className={`text-sm font-medium ${serviceType === 'Others' ? 'text-[#0E8F79] dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Others</span>
              </div>
              {serviceType === 'Others' && (
                <div onClick={(e) => e.stopPropagation()}>
                  <input type="text" placeholder="Please specify the service..." value={serviceOthersText} onChange={(e) => { setServiceOthersText(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, serviceOthersText: false })); }} className={`mt-1 w-full text-sm border-b ${errors['serviceOthersText'] ? 'border-red-400' : 'border-[#3BC25B]'} bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none`} autoFocus />
                  {errors['serviceOthersText'] && <p className="text-red-500 text-xs mt-1">Please specify the service</p>}
                </div>
              )}
            </div>
          </div>
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
          <textarea rows={8} value={description} onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, description: false })); }} className={`${inputCls} resize-none ${errors['description'] ? errorRing : ''}`} placeholder="Please describe the problem in detail. Include any error messages, steps to reproduce, and when the issue started..." />
          {errors['description'] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </Card>

        <div className="pt-4">
          <GreenButton fullWidth className="py-4 text-lg shadow-lg shadow-green-500/20">Submit Service Ticket</GreenButton>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">By submitting, you agree to our support terms and conditions.</p>
        </div>
      </form>

      {/* Modal Flow: calling → ongoing → priority → assign */}
      {modalStep !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Step 1: Calling - 5 second countdown */}
            {modalStep === 'calling' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-pulse">
                  <Phone className="w-10 h-10 text-[#3BC25B]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Calling Client...</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{contactValues.contactPerson || 'Client'} — {contactValues.mobile || 'N/A'}</p>
                <div className="text-5xl font-bold text-[#3BC25B] mb-6 tabular-nums">{countdown}</div>
                <p className="text-sm text-gray-400 dark:text-gray-500">Connecting to the client...</p>
              </div>
            )}

            {/* Step 2: Ongoing Call */}
            {modalStep === 'ongoing' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-10 h-10 text-white animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Call Connected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-2">{contactValues.contactPerson || 'Client'} — {contactValues.mobile || 'N/A'}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium mb-8">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Ongoing Call
                </div>
                <div>
                  <button onClick={handleEndCall} className="flex items-center gap-2 mx-auto px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors shadow-lg shadow-red-500/30">
                    <PhoneOff className="w-5 h-5" /> End Call
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Priority Level Selection */}
            {modalStep === 'priority' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Set Priority Level</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select the priority for this ticket</p>
                  </div>
                  <button onClick={() => setModalStep('none')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ticket:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stfNo}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      className={`px-4 py-4 rounded-xl border-2 text-sm font-bold transition-all ${priorityLevel === label ? active : `${color} hover:opacity-80`}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <button onClick={handleConfirmPriority} className="w-full px-4 py-2.5 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-bold transition-colors">
                    Confirm Priority
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Assign Employee */}
            {modalStep === 'assign' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assign Employee</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select an employee to handle this ticket</p>
                  </div>
                  <button onClick={() => setModalStep('none')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ticket:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stfNo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                    <span className={`font-semibold ${priorityLevel === 'Critical' ? 'text-red-600' : priorityLevel === 'High' ? 'text-orange-600' : priorityLevel === 'Medium' ? 'text-yellow-600' : 'text-blue-600'}`}>{priorityLevel}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {EMPLOYEES.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => emp.available && setSelectedEmployee(emp.id)}
                      disabled={!emp.available}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        selectedEmployee === emp.id
                          ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]'
                          : emp.available
                          ? 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'
                          : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedEmployee === emp.id ? 'bg-[#3BC25B] text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                        {emp.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{emp.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</div>
                      </div>
                      {!emp.available && <span className="text-xs text-red-400 font-medium">Unavailable</span>}
                      {emp.available && selectedEmployee === emp.id && <CheckCircle2 className="w-5 h-5 text-[#3BC25B]" />}
                      {emp.available && selectedEmployee !== emp.id && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" title="Available" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <button onClick={handleAssign} className="w-full px-4 py-2.5 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4" /> Assign Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

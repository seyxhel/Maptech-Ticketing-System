import React, { useState } from 'react';
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
  
} from 'lucide-react';

const CONTACT_FIELDS = [
  { name: 'client', label: 'Client', placeholder: 'e.g. Maptech Inc.', required: true },
  { name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Juan Dela Cruz', required: true },
  { name: 'landline', label: 'Landline No.', placeholder: 'e.g. (02) 1234-5678', required: false },
  { name: 'mobile', label: 'Mobile No.', placeholder: 'e.g. 09171234567', required: true },
  { name: 'designation', label: 'Designation', placeholder: 'e.g. IT Manager', required: true },
  { name: 'department', label: 'Department / Organization', placeholder: 'e.g. Information Technology', required: true },
] as const;

export function CreateTicket() {
  const getStfNo = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const yyyymmdd = `${y}${m}${day}`;
    const suffix = String(Math.floor(Math.random() * 900000) + 100000); // 6 digits
    return `STF-MP-${yyyymmdd}${suffix}`;
  };
  const [stfNo] = useState(getStfNo);
  const navigate = useNavigate();

  // Contact fields state
  const [contactValues, setContactValues] = useState<Record<string, string>>({
    client: '', contactPerson: '', landline: '', mobile: '', designation: '', department: '',
  });
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [serviceType, setServiceType] = useState('');
  const [serviceOthersText, setServiceOthersText] = useState('');
  const [supportType, setSupportType] = useState('');
  const [description, setDescription] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const setContactField = (name: string, value: string) => {
    setContactValues((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, boolean> = {};

    // Validate contact fields
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

    const now = new Date();
    toast.success('Service Ticket Submitted Successfully', {
      description: `Date: ${now.toLocaleDateString()} | STF No.: ${stfNo} | Time In: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
  };

  const errorRing = 'ring-2 ring-red-400 border-red-400';

  const inputCls =
  'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all';
  const labelCls =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1';
  const sectionHeaderCls =
  'text-sm font-bold text-[#0E8F79] dark:text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 dark:border-gray-700';
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          SERVICE TICKET FORM
        </h1>
        <p className="text-[#0E8F79] dark:text-green-400 font-medium mt-1">
          Maptech Information Solutions Inc.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
          {[
          {
            icon: Calendar,
            label: 'Date',
            value: new Date().toLocaleDateString()
          },
          {
            icon: FileText,
            label: 'STF No.',
            value: stfNo
          },
          {
            icon: Clock,
            label: 'Time In',
            value: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }].
          map(({ icon: Icon, label, value }) =>
          <div key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#3BC25B]" />
              <span className="font-semibold">{label}:</span> {value}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>1. Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTACT_FIELDS.map((f) =>
            <div key={f.name}>
                <label className={labelCls}>
                  {f.label} {f.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={contactValues[f.name]}
                  onChange={(e) => setContactField(f.name, e.target.value)}
                  className={`${inputCls} ${errors[f.name] ? errorRing : ''}`}
                />
                {errors[f.name] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              </div>
            )}
            <div>
              <label className={labelCls}>Email Address <span className="text-red-500 ml-1">*</span></label>
              <input
                type="email"
                placeholder="e.g. juandelacruz@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, email: false })); }}
                className={`${inputCls} ${errors['email'] ? errorRing : ''}`}
              />
              {errors['email'] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
            <div className="md:col-span-2">
                <label className={labelCls}>Full Address <span className="text-red-500 ml-1">*</span></label>
              <textarea
                rows={2}
                placeholder="e.g. 123 Main Street, Quezon City, Metro Manila"
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, address: false })); }}
                className={`${inputCls} resize-none ${errors['address'] ? errorRing : ''}`}
              />
              {errors['address'] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
          </div>
        </Card>

        {/* Section 2 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>2. Type of Service <span className="text-red-500 ml-1">*</span></h3>
          {errors['serviceType'] && <p className="text-red-500 text-xs mb-3 -mt-4">Please select a type of service</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
            {
              label: 'Demo / POC',
              icon: Monitor
            },
            {
              label: 'Ocular Inspection',
              icon: Search
            },
            {
              label: 'Installation',
              icon: Wrench
            },
            {
              label: 'Repair / Service',
              icon: Wrench
            },
            {
              label: 'Migration to HCI',
              icon: Server
            }].
            map(({ label, icon: Icon }) =>
            <div
              key={label}
              onClick={() => { setServiceType((prev) => prev === label ? '' : label); setErrors((p) => ({ ...p, serviceType: false })); }}
              className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center gap-3 ${serviceType === label ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'}`}>

                <div
                className={`p-2 rounded-full ${serviceType === label ? 'bg-[#3BC25B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>

                  <Icon className="w-4 h-4" />
                </div>
                <span
                className={`text-sm font-medium ${serviceType === label ? 'text-[#0E8F79] dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>

                  {label}
                </span>
              </div>
            )}
            <div
              onClick={() => { setServiceType((prev) => prev === 'Others' ? '' : 'Others'); setErrors((p) => ({ ...p, serviceType: false })); }}
              className={`cursor-pointer p-4 rounded-lg border transition-all flex flex-col gap-2 ${serviceType === 'Others' ? 'border-[#3BC25B] bg-[#f0fdf4] dark:bg-green-900/20 ring-1 ring-[#3BC25B]' : 'border-gray-200 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-gray-50 dark:hover:bg-gray-700'}`}>

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${serviceType === 'Others' ? 'bg-[#3BC25B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>

                  <FileText className="w-4 h-4" />
                </div>
                <span
                  className={`text-sm font-medium ${serviceType === 'Others' ? 'text-[#0E8F79] dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>

                  Others
                </span>
              </div>
              {serviceType === 'Others' &&
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Please specify the service..."
                  value={serviceOthersText}
                  onChange={(e) => { setServiceOthersText(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, serviceOthersText: false })); }}
                  className={`mt-1 w-full text-sm border-b ${errors['serviceOthersText'] ? 'border-red-400' : 'border-[#3BC25B]'} bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none`}
                  autoFocus />
                {errors['serviceOthersText'] && <p className="text-red-500 text-xs mt-1">Please specify the service</p>}
              </div>
              }
            </div>
          </div>
        </Card>

        {/* Section 3 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>3. Preferred Type of Support <span className="text-red-500 ml-1">*</span></h3>
          {errors['supportType'] && <p className="text-red-500 text-xs mb-3 -mt-4">Please select a support type</p>}
          <div className="flex flex-wrap gap-4">
            {['Remote / Online', 'Onsite', 'Chat', 'Call'].map((type) =>
            <button
              key={type}
              type="button"
              onClick={() => { setSupportType((prev) => prev === type ? '' : type); setErrors((p) => ({ ...p, supportType: false })); }}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all border ${supportType === type ? 'bg-[#0E8F79] text-white border-[#0E8F79] shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>

                {type}
              </button>
            )}
          </div>
        </Card>

        {/* Section 4 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>4. Description of Problem <span className="text-red-500 ml-1">*</span></h3>
          <textarea
            rows={8}
            value={description}
            onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, description: false })); }}
            className={`${inputCls} resize-none ${errors['description'] ? errorRing : ''}`}
            placeholder="Please describe the problem in detail. Include any error messages, steps to reproduce, and when the issue started..." />
          {errors['description'] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </Card>

        <div className="pt-4">
          <GreenButton
            fullWidth
            className="py-4 text-lg shadow-lg shadow-green-500/20">

            Submit Service Ticket
          </GreenButton>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            By submitting, you agree to our support terms and conditions.
          </p>
        </div>
      </form>
    </div>);

}
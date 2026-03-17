import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import { toast } from 'sonner';
import {
  Calendar,
  FileText,
  Monitor,
  Wrench,
  Server,
  Search,
  
} from 'lucide-react';
import {
  validateEmail, validatePhone, validateLandline, validateRequired,
  validateAddress, validateDescription, sanitize,
  MAX_FIELD, MAX_EMAIL, MAX_PHONE, MAX_ADDRESS, MAX_DESCRIPTION,
} from '../../utils/validation';
import { createTicket, fetchProducts } from '../../services/api';
import type { Product } from '../../services/api';

const CONTACT_FIELDS = [
  { name: 'client', label: 'Client', placeholder: 'e.g. Maptech Inc.', required: true },
  { name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Juan Dela Cruz', required: true },
  { name: 'landline', label: 'Landline No.', placeholder: 'e.g. (02) 1234-5678', required: false },
  { name: 'mobile', label: 'Mobile No.', placeholder: 'e.g. 09171234567', required: true },
  { name: 'designation', label: 'Designation', placeholder: 'e.g. IT Manager', required: true },
  { name: 'department', label: 'Department / Organization', placeholder: 'e.g. Information Technology', required: true },
] as const;

export default function CreateTicket() {
  const getStfNo = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const yyyymmdd = `${y}${m}${day}`;
    const suffix = String(Math.floor(Math.random() * 900000) + 100000); // 6 digits
    return `STF-MT-${yyyymmdd}${suffix}`;
  };
  const [stfNo] = useState(getStfNo);
  const navigate = useNavigate();

  // Contact fields state
  const [contactValues, setContactValues] = useState<Record<string, string>>({
    client: '', contactPerson: '', landline: '', mobile: '', designation: '', department: '',
  });
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [productInfo, setProductInfo] = useState({
    device_equipment: '',
    product_name: '',
    brand: '',
    model_name: '',
    serial_no: '',
    version_no: '',
    date_purchased: '',
    has_warranty: false,
    sales_no: '',
  });

  // New/existing product toggle
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts().then((p) => setProducts(p)).catch(() => {});
  }, []);

  const selectedProduct = selectedProductId ? products.find((p) => p.id === selectedProductId) ?? null : null;

  const [serviceType, setServiceType] = useState('');
  const [serviceOthersText, setServiceOthersText] = useState('');
  const [supportType, setSupportType] = useState('');
  const [description, setDescription] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [errorMsgs, setErrorMsgs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setContactField = (name: string, value: string) => {
    setContactValues((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, boolean> = {};
    const msgs: Record<string, string> = {};

    // Validate contact fields
    CONTACT_FIELDS.forEach((f) => {
      if (f.name === 'mobile') {
        const err = validatePhone(contactValues[f.name], 'Mobile number');
        if (err) { newErrors[f.name] = true; msgs[f.name] = err; }
      } else if (f.name === 'landline') {
        const err = validateLandline(contactValues[f.name]);
        if (err) { newErrors[f.name] = true; msgs[f.name] = err; }
      } else if (f.required) {
        const err = validateRequired(contactValues[f.name], f.label);
        if (err) { newErrors[f.name] = true; msgs[f.name] = err; }
      }
    });
    const emailErr = validateEmail(email);
    if (emailErr) { newErrors['email'] = true; msgs['email'] = emailErr; }
    const addrErr = validateAddress(address);
    if (addrErr) { newErrors['address'] = true; msgs['address'] = addrErr; }
    if (!serviceType) { newErrors['serviceType'] = true; msgs['serviceType'] = 'Please select a type of service'; }
    if (serviceType === 'Others' && !serviceOthersText.trim()) { newErrors['serviceOthersText'] = true; msgs['serviceOthersText'] = 'Please specify the service'; }
    if (!supportType) { newErrors['supportType'] = true; msgs['supportType'] = 'Please select a support type'; }
    const descErr = validateDescription(description, 'Description of problem');
    if (descErr) { newErrors['description'] = true; msgs['description'] = descErr; }

    setErrors(newErrors);
    setErrorMsgs(msgs);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const supportTypeMap: Record<string, string> = {
      'Remote / Online': 'remote_online',
      'Onsite': 'onsite',
      'Chat': 'chat',
      'Call': 'call',
    };

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        client: sanitize(contactValues.client),
        contact_person: sanitize(contactValues.contactPerson),
        landline: contactValues.landline,
        mobile_no: contactValues.mobile,
        designation: sanitize(contactValues.designation),
        department_organization: sanitize(contactValues.department),
        email_address: email.trim(),
        address: sanitize(address),
        preferred_support_type: supportTypeMap[supportType] || 'remote_online',
        description_of_problem: sanitize(description),
        type_of_service_others: serviceType === 'Others' ? sanitize(serviceOthersText) : serviceType,
      };

      if (isExistingProduct && selectedProductId && selectedProduct) {
        payload.product_record = selectedProductId;
        if (selectedProduct.product_name) payload.product = selectedProduct.product_name;
        if (selectedProduct.brand) payload.brand = selectedProduct.brand;
        if (selectedProduct.model_name) payload.model_name = selectedProduct.model_name;
        if (selectedProduct.serial_no) payload.serial_no = selectedProduct.serial_no;
        if (productInfo.sales_no.trim()) payload.sales_no = sanitize(productInfo.sales_no);
      } else {
        if (productInfo.device_equipment.trim()) payload.device_equipment = sanitize(productInfo.device_equipment);
        if (productInfo.product_name.trim()) payload.product = sanitize(productInfo.product_name);
        if (productInfo.brand.trim()) payload.brand = sanitize(productInfo.brand);
        if (productInfo.model_name.trim()) payload.model_name = sanitize(productInfo.model_name);
        if (productInfo.serial_no.trim()) payload.serial_no = sanitize(productInfo.serial_no);
        if (productInfo.version_no.trim()) payload.version_no = sanitize(productInfo.version_no);
        if (productInfo.date_purchased) payload.date_purchased = productInfo.date_purchased;
        payload.has_warranty = productInfo.has_warranty;
        if (productInfo.sales_no.trim()) payload.sales_no = sanitize(productInfo.sales_no);
      }

      const created = await createTicket(payload as any);
      toast.success('Service Ticket Submitted Successfully', {
        description: `STF No.: ${created.stf_no}`,
      });
      navigate(`/client/ticket-details?stf=${encodeURIComponent(created.stf_no)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit ticket.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
                  maxLength={f.name === 'mobile' || f.name === 'landline' ? MAX_PHONE : MAX_FIELD}
                  className={`${inputCls} ${errors[f.name] ? errorRing : ''}`}
                />
                {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errorMsgs[f.name] || 'This field is required'}</p>}
              </div>
            )}
            <div>
              <label className={labelCls}>Email Address <span className="text-red-500 ml-1">*</span></label>
              <input
                type="email"
                placeholder="e.g. juandelacruz@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, email: false })); }}
                maxLength={MAX_EMAIL}
                className={`${inputCls} ${errors['email'] ? errorRing : ''}`}
              />
              {errors['email'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['email'] || 'This field is required'}</p>}
            </div>
            <div className="md:col-span-2">
                <label className={labelCls}>Full Address <span className="text-red-500 ml-1">*</span></label>
              <textarea
                rows={2}
                placeholder="e.g. 123 Main Street, Quezon City, Metro Manila"
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, address: false })); }}
                maxLength={MAX_ADDRESS}
                className={`${inputCls} resize-none ${errors['address'] ? errorRing : ''}`}
              />
              {errors['address'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['address'] || 'This field is required'}</p>}
            </div>
          </div>
        </Card>

        {/* Section 2 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>2. Product Details</h3>

          {/* New / Existing product toggle */}
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => { setIsExistingProduct(false); setSelectedProductId(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                !isExistingProduct
                  ? 'bg-[#0E8F79] text-white border-[#0E8F79]'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              New Product
            </button>
            <button
              type="button"
              onClick={() => { setIsExistingProduct(true); setProductInfo({ device_equipment: '', product_name: '', brand: '', model_name: '', serial_no: '', version_no: '', date_purchased: '', has_warranty: false, sales_no: '' }); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isExistingProduct
                  ? 'bg-[#0E8F79] text-white border-[#0E8F79]'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              Existing Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isExistingProduct ? (
              <>
                <div>
                  <label className={labelCls}>Device / Equipment</label>
                  <input type="text" placeholder="e.g. Fingerprint Terminal" value={productInfo.device_equipment} onChange={(e) => setProductInfo((p) => ({ ...p, device_equipment: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Product</label>
                  <input type="text" placeholder="e.g. ZK-K40" value={productInfo.product_name} onChange={(e) => setProductInfo((p) => ({ ...p, product_name: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Brand</label>
                  <input type="text" placeholder="e.g. ZKTeco" value={productInfo.brand} onChange={(e) => setProductInfo((p) => ({ ...p, brand: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Model</label>
                  <input type="text" placeholder="e.g. K40" value={productInfo.model_name} onChange={(e) => setProductInfo((p) => ({ ...p, model_name: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Serial No.</label>
                  <input type="text" placeholder="e.g. SN123456" value={productInfo.serial_no} onChange={(e) => setProductInfo((p) => ({ ...p, serial_no: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Version No.</label>
                  <input type="text" placeholder="e.g. FW 6.60" value={productInfo.version_no} onChange={(e) => setProductInfo((p) => ({ ...p, version_no: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date Purchased</label>
                  <input type="date" value={productInfo.date_purchased} onChange={(e) => setProductInfo((p) => ({ ...p, date_purchased: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Warranty</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setProductInfo((p) => ({ ...p, has_warranty: true }))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${productInfo.has_warranty ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>With Warranty</button>
                    <button type="button" onClick={() => setProductInfo((p) => ({ ...p, has_warranty: false }))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${!productInfo.has_warranty ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>Without Warranty</button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Sales / Invoice No.</label>
                  <input type="text" placeholder="e.g. INV-2025-001" value={productInfo.sales_no} onChange={(e) => setProductInfo((p) => ({ ...p, sales_no: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className={labelCls}>Select Product (optional)</label>
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
                    className={inputCls}
                  >
                    <option value="">— Select a product —</option>
                    {products.filter((p) => p.is_active).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name || p.device_equipment || '—'}
                        {p.brand ? ` | ${p.brand}` : ''}
                        {p.model_name ? ` | ${p.model_name}` : ''}
                        {p.serial_no ? ` | S/N: ${p.serial_no}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedProduct && (
                  <>
                    {selectedProduct.product_name && (
                      <div><label className={labelCls}>Product</label><input readOnly value={selectedProduct.product_name} className={`${inputCls} opacity-70 cursor-default`} /></div>
                    )}
                    {selectedProduct.brand && (
                      <div><label className={labelCls}>Brand</label><input readOnly value={selectedProduct.brand} className={`${inputCls} opacity-70 cursor-default`} /></div>
                    )}
                    {selectedProduct.model_name && (
                      <div><label className={labelCls}>Model</label><input readOnly value={selectedProduct.model_name} className={`${inputCls} opacity-70 cursor-default`} /></div>
                    )}
                    {selectedProduct.serial_no && (
                      <div><label className={labelCls}>Serial No.</label><input readOnly value={selectedProduct.serial_no} className={`${inputCls} opacity-70 cursor-default`} /></div>
                    )}
                  </>
                )}
                <div className={selectedProductId ? '' : 'md:col-span-2'}>
                  <label className={labelCls}>Sales / Invoice No.</label>
                  <input type="text" placeholder="e.g. INV-2025-001" value={productInfo.sales_no} onChange={(e) => setProductInfo((p) => ({ ...p, sales_no: e.target.value }))} maxLength={MAX_FIELD} className={inputCls} />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Section 3 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>3. Type of Service <span className="text-red-500 ml-1">*</span></h3>
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

        {/* Section 4 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>4. Preferred Type of Support <span className="text-red-500 ml-1">*</span></h3>
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

        {/* Section 5 */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>5. Description of Problem <span className="text-red-500 ml-1">*</span></h3>
          <textarea
            rows={8}
            value={description}
            onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, description: false })); }}
            maxLength={MAX_DESCRIPTION}
            className={`${inputCls} resize-none ${errors['description'] ? errorRing : ''}`}
            placeholder="Please describe the problem in detail. Include any error messages, steps to reproduce, and when the issue started..." />
          {errors['description'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['description'] || 'This field is required'}</p>}
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length} / {MAX_DESCRIPTION}</p>
        </Card>

        <div className="pt-4">
          <GreenButton
            fullWidth
            isLoading={submitting}
            disabled={submitting}
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
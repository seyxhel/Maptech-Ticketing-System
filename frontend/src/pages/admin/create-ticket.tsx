import { useState, useEffect, useCallback } from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel, { stepLabelClasses } from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
// Custom connector: green gradient for completed and active, gray for others
const GradientConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 1,
    background: '#e0e0e0',
    transition: 'background 0.3s',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    background: 'linear-gradient(90deg, #3BC25B 0%, #0E8F79 100%)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    background: 'linear-gradient(90deg, #3BC25B 0%, #0E8F79 100%)',
  },
}));

// Custom icon with gradient background for active/completed
const GradientStepIconRoot = styled('div', {
  shouldForwardProp: (prop) => prop !== 'ownerState',
})(({ ownerState }) => ({
  background: ownerState.active || ownerState.completed
    ? 'linear-gradient(135deg, #3BC25B 0%, #0E8F79 100%)'
    : '#e0e0e0',
  zIndex: 1,
  color: '#fff',
  width: 32,
  height: 32,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 700,
  fontSize: 18,
  boxShadow: ownerState.active || ownerState.completed ? '0 2px 8px 0 rgba(62, 199, 93, 0.15)' : 'none',
  transition: 'background 0.3s',
}));

function GradientStepIcon(props) {
  const { active, completed, className, icon } = props;
  return (
    <GradientStepIconRoot ownerState={{ active, completed }} className={className}>
      {icon}
    </GradientStepIconRoot>
  );
}
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
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
} from '../../utils/validation';
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
  Plus,
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
  fetchNextTicketStfNo,
  fetchTypesOfService,
  fetchClients,
  fetchProducts,
  fetchTickets,
  createCallLog,
  endCallLog,
  linkTickets,
  updateProduct,
  fetchDeviceEquipment,
} from '../../services/api';
import type { TypeOfService as ServiceType, ClientRecord, Product, BackendTicket } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

type AdminCreateTicketDraft = {
  currentStep: number;
  contactValues: Record<string, string>;
  email: string;
  address: string;
  serviceType: string;
  serviceOthersText: string;
  supportType: string;
  description: string;
  selectedSalesRep: string;
  additionalSalesReps: string[];
  isExistingClient: boolean;
  selectedClientId: number | null;
  salesNo: string;
  projectTitle: string;
  isExistingProduct: boolean;
  selectedProductId: number | null;
  newProductInfo: {
    device_equipment: string;
    product_name: string;
    brand: string;
    model_name: string;
    serial_no: string;
    version_no: string;
    date_purchased: string;
    has_warranty: boolean;
  };
  estimatedDaysOverride: number | '';
};

let adminCreateTicketDraft: AdminCreateTicketDraft | null = null;

function formatPriorityLabel(priority?: string | null): string {
  if (!priority) return 'Unknown';
  const normalized = String(priority).replace(/_/g, ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function priorityBadgeClass(priority?: string | null): string {
  const key = String(priority || '').toLowerCase();
  if (key === 'critical') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (key === 'high') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if (key === 'medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (key === 'low') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300';
}

export default function AdminCreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSalesUser = user?.role === 'sales';
  const [searchParams] = useSearchParams();
  const linkedTicketId = searchParams.get('linkedTicketId') ? Number(searchParams.get('linkedTicketId')) : null;
  const linkedStf = searchParams.get('linkedStf') || null;

  const getFallbackStfNo = () => {
    const d = new Date();
    const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `STF-MT-${yyyymmdd}000001`;
  };

  const [stfNo, setStfNo] = useState(getFallbackStfNo);
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
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('');
  const [additionalSalesReps, setAdditionalSalesReps] = useState<string[]>([]);
  const [salesRepModalOpen, setSalesRepModalOpen] = useState(false);
  const [salesRepPage, setSalesRepPage] = useState(1);
  const [newAdditionalSalesRep, setNewAdditionalSalesRep] = useState('');
  const SALES_REP_PAGE_SIZE = 6;
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  // New/existing client toggle
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [existingClients, setExistingClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const CLIENT_PAGE_SIZE = 8;

  // Product picker
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [salesNo, setSalesNo] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const PRODUCT_PAGE_SIZE = 8;

  // New/existing product toggle
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [newProductInfo, setNewProductInfo] = useState({
    device_equipment: '', product_name: '', brand: '', model_name: '',
    serial_no: '', version_no: '', date_purchased: '', has_warranty: false,
  });
  const [savingProductDetails, setSavingProductDetails] = useState(false);
  const [deviceEquipments, setDeviceEquipments] = useState<{ id: number; device_name?: string; device_equipment?: string; is_active?: boolean }[]>([]);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [devicePage, setDevicePage] = useState(1);
  const DEVICE_PAGE_SIZE = 8;

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
  const [callEndTime, setCallEndTime] = useState<Date | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Employee working tickets (for expanded assign modal)
  const [employeeTickets, setEmployeeTickets] = useState<Record<number, BackendTicket[]>>({});

  // After call completion + priority selection, external assignment is no longer shown.
  const canAssignExternal = !(callCompleted && !!priorityLevel);
  const selectedProduct = selectedProductId ? products.find((p) => p.id === selectedProductId) ?? null : null;
  const selectedClient = selectedClientId ? existingClients.find((c) => c.id === selectedClientId) ?? null : null;
  const combinedSalesReps = [selectedSalesRep.trim(), ...additionalSalesReps.map((r) => r.trim()).filter(Boolean)].filter(Boolean).join(', ');

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
    fetchDeviceEquipment().then((list) => { setDeviceEquipments(list); setDevicePage(1); }).catch(() => {});
    fetchNextTicketStfNo()
      .then((nextStfNo) => setStfNo(nextStfNo))
      .catch(() => {});
  }, []);

  // Multi-step form state (reduced to 4 steps; Service now includes Support+Description)
  const steps = ['Contact', 'Product', 'Service', 'Review & Submit'];
  const [currentStep, setCurrentStep] = useState(0);

  const lastStep = steps.length - 1;

  useEffect(() => {
    if (!adminCreateTicketDraft) return;
    const draft = adminCreateTicketDraft;

    setCurrentStep(Math.min(Math.max(draft.currentStep, 0), lastStep));
    setContactValues(draft.contactValues || { client: '', contactPerson: '', landline: '', mobile: '', designation: '', department: '' });
    setEmail(draft.email || '');
    setAddress(draft.address || '');
    setServiceType(draft.serviceType || '');
    setServiceOthersText(draft.serviceOthersText || '');
    setSupportType(draft.supportType || '');
    setDescription(draft.description || '');
    setSelectedSalesRep(draft.selectedSalesRep || '');
    setAdditionalSalesReps(Array.isArray(draft.additionalSalesReps) ? draft.additionalSalesReps : []);
    setIsExistingClient(!!draft.isExistingClient);
    setSelectedClientId(draft.selectedClientId ?? null);
    setSalesNo(draft.salesNo || '');
    setProjectTitle(draft.projectTitle || '');
    setIsExistingProduct(!!draft.isExistingProduct);
    setSelectedProductId(draft.selectedProductId ?? null);
    setNewProductInfo(
      draft.newProductInfo ||
      { device_equipment: '', product_name: '', brand: '', model_name: '', serial_no: '', version_no: '', date_purchased: '', has_warranty: false }
    );
    setEstimatedDaysOverride(draft.estimatedDaysOverride ?? '');
  }, [lastStep]);

  useEffect(() => {
    adminCreateTicketDraft = {
      currentStep,
      contactValues,
      email,
      address,
      serviceType,
      serviceOthersText,
      supportType,
      description,
      selectedSalesRep,
      additionalSalesReps,
      isExistingClient,
      selectedClientId,
      salesNo,
      projectTitle,
      isExistingProduct,
      selectedProductId,
      newProductInfo,
      estimatedDaysOverride,
    };
  }, [
    currentStep,
    contactValues,
    email,
    address,
    serviceType,
    serviceOthersText,
    supportType,
    description,
    selectedSalesRep,
    additionalSalesReps,
    isExistingClient,
    selectedClientId,
    salesNo,
    projectTitle,
    isExistingProduct,
    selectedProductId,
    newProductInfo,
    estimatedDaysOverride,
  ]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, boolean> = {};
    const msgs: Record<string, string> = {};
    if (step === 0) {
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
          newErrors[f.name] = true; msgs[f.name] = `${f.label} is required.`;
        }
      });
      if (email.trim()) {
        const emailErr = validateEmail(email);
        if (emailErr) { newErrors['email'] = true; msgs['email'] = emailErr; }
      }
      const addrErr = validateAddress(address);
      if (addrErr) { newErrors['address'] = true; msgs['address'] = addrErr; }
      if (!selectedSalesRep.trim()) { newErrors['salesRepresentative'] = true; msgs['salesRepresentative'] = 'Sales Representative is required.'; }
    }
    if (step === 1) {
      if (!projectTitle.trim()) { newErrors['projectTitle'] = true; msgs['projectTitle'] = 'Project Title is required.'; }
      // require full product details for either existing or new product
      if (isExistingProduct && !selectedProductId) {
        newErrors['product'] = true; msgs['product'] = 'Please select a product.';
      }
      const requiredProductFields = [
        ['device_equipment', newProductInfo.device_equipment, 'Device / Equipment is required.'],
        ['product_name', newProductInfo.product_name, 'Product name is required.'],
        ['brand', newProductInfo.brand, 'Brand is required.'],
        ['model_name', newProductInfo.model_name, 'Model is required.'],
        ['serial_no', newProductInfo.serial_no, 'Serial No. is required.'],
        ['version_no', newProductInfo.version_no, 'Version No. is required.'],
        ['date_purchased', newProductInfo.date_purchased, 'Date Purchased is required.'],
      ];
      for (const [key, val, msg] of requiredProductFields) {
        if (!String(val || '').trim()) { newErrors[key as string] = true; msgs[key as string] = msg; }
      }
      if (!salesNo.trim()) { newErrors['salesNo'] = true; msgs['salesNo'] = 'Sales / Invoice No. is required.'; }
    }
    if (step === 2) {
      // Step 2 now includes: Type of Service (3), Preferred Type of Support (4), Description (5)
      if (!serviceType) { newErrors['serviceType'] = true; msgs['serviceType'] = 'Please select a type of service'; }
      if (serviceType === 'Others' && !serviceOthersText.trim()) { newErrors['serviceOthersText'] = true; msgs['serviceOthersText'] = 'Please specify the service'; }
      if (!supportType) { newErrors['supportType'] = true; msgs['supportType'] = 'Please select a support type'; }
      const descErr = validateDescription(description, 'Description of problem');
      if (descErr) { newErrors['description'] = true; msgs['description'] = descErr; }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    setErrorMsgs((prev) => ({ ...prev, ...msgs }));
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted errors before proceeding.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(lastStep, s + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => { setCurrentStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // When selectedProductId changes, populate newProductInfo so fields become editable
  useEffect(() => {
    if (!selectedProductId) return;
    const p = products.find((x) => x.id === selectedProductId);
    if (!p) return;
    setNewProductInfo({
      device_equipment: p.device_equipment || '',
      product_name: p.product_name || '',
      brand: p.brand || '',
      model_name: p.model_name || '',
      serial_no: p.serial_no || '',
      version_no: p.version_no || '',
      date_purchased: p.date_purchased || '',
      has_warranty: !!p.has_warranty,
    });
    setErrors((prev) => ({ ...prev, product: false, product_name: false, brand: false, model_name: false, serial_no: false, version_no: false, date_purchased: false, salesNo: false, device_equipment: false }));
  }, [selectedProductId, products]);

  const handleSaveProductDetails = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product to save.');
      return;
    }
    setSavingProductDetails(true);
    try {
      const payload: Partial<Product> = {
        device_equipment: newProductInfo.device_equipment || null,
        product_name: newProductInfo.product_name || null,
        brand: newProductInfo.brand || null,
        model_name: newProductInfo.model_name || null,
        serial_no: newProductInfo.serial_no || null,
        version_no: newProductInfo.version_no || null,
        date_purchased: newProductInfo.date_purchased || null,
        has_warranty: newProductInfo.has_warranty,
      };
      await updateProduct(selectedProductId, payload);
      const refreshed = await fetchProducts();
      setProducts(refreshed);
      toast.success('Product details saved.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product details.');
    } finally {
      setSavingProductDetails(false);
    }
  };

  const applySelectedProductToTicketData = (ticketData: Record<string, unknown>) => {
    if (!selectedProductId) return;

    ticketData.product_record = selectedProductId;
    if (!selectedProduct) return;

    if (selectedProduct.device_equipment) ticketData.device_equipment = selectedProduct.device_equipment;
    if (selectedProduct.product_name) ticketData.product = selectedProduct.product_name;
    if (selectedProduct.brand) ticketData.brand = selectedProduct.brand;
    if (selectedProduct.model_name) ticketData.model_name = selectedProduct.model_name;
    if (selectedProduct.version_no) ticketData.version_no = selectedProduct.version_no;
    if (selectedProduct.date_purchased) ticketData.date_purchased = selectedProduct.date_purchased;
    if (selectedProduct.serial_no) ticketData.serial_no = selectedProduct.serial_no;
    if (selectedProduct.has_warranty) ticketData.has_warranty = selectedProduct.has_warranty;
    if (selectedProduct.others) ticketData.others = selectedProduct.others;
    ticketData.sales_no = salesNo.trim() || selectedProduct.sales_no || '';
  };

  const setContactField = (name: string, value: string) => {
    setContactValues((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const formatSalesRepInput = (value: string) => {
    if (!value) return value;
    return value.replace(/(^|\s)([a-zA-Z])/g, (_, prefix: string, ch: string) => `${prefix}${ch.toUpperCase()}`);
  };

  const addAdditionalSalesRep = () => {
    const value = newAdditionalSalesRep.trim();
    if (!value) return;
    setAdditionalSalesReps((prev) => {
      const updated = [...prev, value];
      setSalesRepPage(Math.max(1, Math.ceil(updated.length / SALES_REP_PAGE_SIZE)));
      return updated;
    });
    setNewAdditionalSalesRep('');
    setErrors((prev) => ({ ...prev, salesRepresentative: false }));
    setErrorMsgs((prev) => ({ ...prev, salesRepresentative: '' }));
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
      setSelectedSalesRep(((client as any).sales_representative || '').trim());
      setAdditionalSalesReps(Array.isArray((client as any).additional_sales_reps) ? (client as any).additional_sales_reps.filter(Boolean).map((rep: string) => String(rep).trim()) : []);
      setErrors((prev) => ({ ...prev, salesRepresentative: false }));
      setErrorMsgs((prev) => ({ ...prev, salesRepresentative: '' }));
    }
  };

  useEffect(() => {
    setClientPage(1);
  }, [clientSearch]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearch]);

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

    if (!selectedSalesRep.trim()) {
      newErrors['salesRepresentative'] = true;
      msgs['salesRepresentative'] = 'Sales Representative is required.';
    }

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

    if (isSalesUser) {
      const supportTypeMap: Record<string, string> = {
        'Remote / Online': 'remote_online',
        'Remote/Online': 'remote_online',
        Onsite: 'onsite',
        Chat: 'chat',
        Call: 'call',
      };

      const matchedService = serviceTypes.find((s) => s.name === serviceType);

      try {
        const ticketData: Record<string, unknown> = {
          project_title: projectTitle.trim(),
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
        };

        if (combinedSalesReps) {
          ticketData.sales_representative = combinedSalesReps;
        }

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

        if (isExistingProduct) {
          applySelectedProductToTicketData(ticketData);
          if (salesNo.trim()) ticketData.sales_no = salesNo.trim();
        } else {
          if (newProductInfo.device_equipment.trim()) ticketData.device_equipment = newProductInfo.device_equipment.trim();
          if (newProductInfo.product_name.trim()) ticketData.product = newProductInfo.product_name.trim();
          if (newProductInfo.brand.trim()) ticketData.brand = newProductInfo.brand.trim();
          if (newProductInfo.model_name.trim()) ticketData.model_name = newProductInfo.model_name.trim();
          if (newProductInfo.serial_no.trim()) ticketData.serial_no = newProductInfo.serial_no.trim();
          if (newProductInfo.version_no.trim()) ticketData.version_no = newProductInfo.version_no.trim();
          if (newProductInfo.date_purchased) ticketData.date_purchased = newProductInfo.date_purchased;
          ticketData.has_warranty = newProductInfo.has_warranty;
          if (salesNo.trim()) ticketData.sales_no = salesNo.trim();
        }

        const created = await createTicket(ticketData as never);
        adminCreateTicketDraft = null;
        toast.success(`STF ${created.stf_no} submitted to supervisors for call and priority review.`);
        navigate(`/admin/ticket-details?stf=${encodeURIComponent(created.stf_no)}`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to create ticket.');
      }
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
    setCallEndTime(null);
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
    setCallEndTime(new Date());
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
        project_title: projectTitle.trim(),
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

      if (combinedSalesReps) {
        ticketData.sales_representative = combinedSalesReps;
      }

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
      if (isExistingProduct) {
        applySelectedProductToTicketData(ticketData);
        if (salesNo.trim()) ticketData.sales_no = salesNo.trim();
      } else {
        if (newProductInfo.device_equipment.trim()) ticketData.device_equipment = newProductInfo.device_equipment.trim();
        if (newProductInfo.product_name.trim()) ticketData.product = newProductInfo.product_name.trim();
        if (newProductInfo.brand.trim()) ticketData.brand = newProductInfo.brand.trim();
        if (newProductInfo.model_name.trim()) ticketData.model_name = newProductInfo.model_name.trim();
        if (newProductInfo.serial_no.trim()) ticketData.serial_no = newProductInfo.serial_no.trim();
        if (newProductInfo.version_no.trim()) ticketData.version_no = newProductInfo.version_no.trim();
        if (newProductInfo.date_purchased) ticketData.date_purchased = newProductInfo.date_purchased;
        ticketData.has_warranty = newProductInfo.has_warranty;
        if (salesNo.trim()) ticketData.sales_no = salesNo.trim();
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
      adminCreateTicketDraft = null;
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
        project_title: projectTitle.trim(),
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

      if (combinedSalesReps) {
        ticketData.sales_representative = combinedSalesReps;
      }

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
      if (isExistingProduct) {
        applySelectedProductToTicketData(ticketData);
        if (salesNo.trim()) ticketData.sales_no = salesNo.trim();
      } else {
        if (newProductInfo.device_equipment.trim()) ticketData.device_equipment = newProductInfo.device_equipment.trim();
        if (newProductInfo.product_name.trim()) ticketData.product = newProductInfo.product_name.trim();
        if (newProductInfo.brand.trim()) ticketData.brand = newProductInfo.brand.trim();
        if (newProductInfo.model_name.trim()) ticketData.model_name = newProductInfo.model_name.trim();
        if (newProductInfo.serial_no.trim()) ticketData.serial_no = newProductInfo.serial_no.trim();
        if (newProductInfo.version_no.trim()) ticketData.version_no = newProductInfo.version_no.trim();
        if (newProductInfo.date_purchased) ticketData.date_purchased = newProductInfo.date_purchased;
        ticketData.has_warranty = newProductInfo.has_warranty;
        if (salesNo.trim()) ticketData.sales_no = salesNo.trim();
      }

      const created = await createTicket(ticketData as any);

      // Link to original ticket if this was triggered from "Link Ticket / Same Problem"
      if (linkedTicketId) {
        try {
          await linkTickets(linkedTicketId, [created.id]);
        } catch { /* linking is best-effort */ }
      }

      setModalStep('none');
      adminCreateTicketDraft = null;
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

      <form onSubmit={(e) => { e.preventDefault(); if (currentStep === lastStep) handleSubmit(e); else goNext(); }} className="space-y-6">
        {/* Progress tracker (MUI Stepper) */}
        <div className="mb-8">
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            connector={<GradientConnector />}
            sx={{
              [`& .${stepLabelClasses.label}`]: {
                color: '#0E8F79',
                fontWeight: 500,
                fontSize: 16,
                '&.Mui-active': {
                  color: '#0E8F79',
                },
                '&.Mui-completed': {
                  color: '#3BC25B',
                },
              },
            }}
          >
            {steps.map((label, idx) => (
              <Step key={label}>
                <StepLabel StepIconComponent={GradientStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>
        {/* Section 1: Contact Info */}
        {currentStep === 0 && (
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClientPickerOpen(true)}
                  className={`${inputCls} text-left`}
                >
                  {selectedClient
                    ? `${selectedClient.client_name}${selectedClient.contact_person ? ` (${selectedClient.contact_person})` : ''}`
                    : 'Select a client'}
                </button>
                {selectedClientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientId(null);
                      setContactValues({
                        client: '', contactPerson: '', landline: '', mobile: '', designation: '', department: '',
                      });
                      setEmail('');
                      setAddress('');
                      setSelectedSalesRep('');
                      setAdditionalSalesReps([]);
                    }}
                    className="px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTACT_FIELDS.map((f) => (
              <div key={f.name}>
                <label className={labelCls}>
                  {f.label} {f.required && <span className="text-red-500 ml-1">*</span>}
                  {f.name === 'landline' && <span className="text-gray-400 text-xs font-normal">(optional)</span>}
                </label>
                <input type="text" placeholder={f.placeholder} value={contactValues[f.name]} onChange={(e) => { const val = e.target.value; if (f.name === 'mobile' && val !== '' && !/^\d*$/.test(val)) return; if (f.name === 'landline' && val !== '' && !/^[\d()\-\s]*$/.test(val)) return; setContactField(f.name, val); }} maxLength={f.name === 'mobile' ? 11 : f.name === 'landline' ? MAX_PHONE : MAX_FIELD} className={`${inputCls} ${errors[f.name] ? errorRing : ''}`} />
                {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errorMsgs[f.name] || 'This field is required'}</p>}
              </div>
            ))}
            <div>
              <label className={labelCls}>Sales Representative <span className="text-red-500 ml-1">*</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Primary sales representative"
                  value={selectedSalesRep}
                  onChange={(e) => {
                    setSelectedSalesRep(formatSalesRepInput(e.target.value));
                    setErrors((p) => ({ ...p, salesRepresentative: false }));
                    setErrorMsgs((p) => ({ ...p, salesRepresentative: '' }));
                  }}
                  className={`${inputCls} ${errors['salesRepresentative'] ? errorRing : ''}`}
                />
                <button
                  type="button"
                  onClick={() => { setSalesRepPage(1); setSalesRepModalOpen(true); }}
                  disabled={!selectedSalesRep.trim()}
                  className={`h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg border transition-colors ${
                    selectedSalesRep.trim()
                      ? 'border-[#0E8F79] bg-[#0E8F79] text-white hover:bg-[#0B7A68]'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  aria-label="Add additional sales representative"
                  title="Add additional sales representative"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors['salesRepresentative'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['salesRepresentative'] || 'This field is required'}</p>}
              {additionalSalesReps.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Other representative(s): {additionalSalesReps.join(', ')}</p>
              )}
            </div>
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
        )}

        {/* Navigation controls for step 0 */}
        {currentStep === 0 && (
          <div className="flex justify-end gap-3">
            <GreenButton type="button" variant="outline" onClick={() => { setContactValues({ client: '', contactPerson: '', landline: '', mobile: '', designation: '', department: '' }); setEmail(''); setAddress(''); setSelectedSalesRep(''); setAdditionalSalesReps([]); }}>Clear</GreenButton>
            <GreenButton type="button" onClick={goNext}>Next</GreenButton>
          </div>
        )}

        {/* Device selection modal */}
        {deviceModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Select Device / Equipment (Category)</h4>
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={deviceSearch}
                    onChange={(e) => { setDeviceSearch(e.target.value); setDevicePage(1); }}
                    placeholder="Search device/equipment (category)..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(() => {
                      const filtered = deviceEquipments.filter((d) => d.is_active !== false).filter((d) => ((d.name || d.device_equipment || d.device_name) || '').toLowerCase().includes(deviceSearch.toLowerCase()));
                      const total = filtered.length;
                      const totalPages = Math.max(1, Math.ceil(total / DEVICE_PAGE_SIZE));
                      const currentPage = Math.min(devicePage, totalPages);
                      const start = (currentPage - 1) * DEVICE_PAGE_SIZE;
                      const pageItems = filtered.slice(start, start + DEVICE_PAGE_SIZE);
                      return (
                        <>
                          {pageItems.map((d) => {
                            const title = d.name || d.device_equipment || d.device_name || 'Unnamed';
                            const isSelectedDevice = (newProductInfo.device_equipment || '').toLowerCase() === title.toLowerCase();
                            return (
                              <div key={d.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</div>
                                {isSelectedDevice ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-semibold">Selected</span>
                                ) : (
                                  <button type="button" onClick={() => { setNewProductInfo((p) => ({ ...p, device_equipment: title })); setErrors((p) => ({ ...p, device_equipment: false })); setDeviceModalOpen(false); }} className="px-3 py-1.5 rounded-lg bg-[#0E8F79] hover:bg-[#0B7A68] text-white text-sm font-medium transition-colors">Select</button>
                                )}
                              </div>
                            );
                          })}

                          {total === 0 && (
                            <div className="px-4 py-10 text-sm text-center text-gray-500">No device/equipment (category) found.</div>
                          )}

                          {total > DEVICE_PAGE_SIZE && (
                            <div className="px-4 py-3 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/50">
                              <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setDevicePage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}>Prev</button>
                                <button type="button" onClick={() => setDevicePage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}>Next</button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        , document.body)}

        {salesRepModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Sales Representatives</h4>
                <button
                  type="button"
                  onClick={() => setSalesRepModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]">

              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">Primary Sales Representative</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedSalesRep.trim() || 'Not set'}</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAdditionalSalesRep}
                  onChange={(e) => setNewAdditionalSalesRep(formatSalesRepInput(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAdditionalSalesRep();
                    }
                  }}
                  placeholder="Type additional sales representative"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={addAdditionalSalesRep}
                  className="px-4 py-2.5 rounded-lg bg-[#0E8F79] hover:bg-[#0B7A68] text-white text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {(() => {
                  const total = additionalSalesReps.length;
                  const totalPages = Math.max(1, Math.ceil(total / SALES_REP_PAGE_SIZE));
                  const currentPage = Math.min(salesRepPage, totalPages);
                  const start = (currentPage - 1) * SALES_REP_PAGE_SIZE;
                  const pageItems = additionalSalesReps.slice(start, start + SALES_REP_PAGE_SIZE);

                  return (
                    <>
                {pageItems.map((rep, index) => {
                  const actualIndex = start + index;
                  return (
                  <div key={`${rep}-${index}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{rep}</span>
                    <button
                      type="button"
                      onClick={() => setAdditionalSalesReps((prev) => {
                        const updated = prev.filter((_, i) => i !== actualIndex);
                        setSalesRepPage((p) => Math.min(p, Math.max(1, Math.ceil(updated.length / SALES_REP_PAGE_SIZE))));
                        return updated;
                      })}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                      aria-label={`Remove ${rep}`}
                      title={`Remove ${rep}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  );
                })}
                {additionalSalesReps.length === 0 && (
                  <p className="px-4 py-10 text-sm text-center text-gray-500 dark:text-gray-400">No additional sales representatives yet.</p>
                )}
                {total > SALES_REP_PAGE_SIZE && (
                  <div className="px-4 py-3 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/50">
                    <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSalesRepPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setSalesRepPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                    </>
                  );
                })()}
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={() => setSalesRepModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-[#0E8F79] hover:bg-[#0B7A68] text-white text-sm font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
          </div>
        , document.body)}

        {clientPickerOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Select Existing Client</h4>
                <button
                  type="button"
                  onClick={() => setClientPickerOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setClientPage(1); }}
                    placeholder="Search by client, contact person, email, or mobile..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(() => {
                      const query = clientSearch.trim().toLowerCase();
                      const filtered = existingClients
                        .filter((c) => c.is_active)
                        .filter((c) => {
                          if (!query) return true;
                          const haystack = [
                            c.client_name,
                            c.contact_person,
                            c.email_address,
                            c.mobile_no,
                            c.landline,
                            c.department_organization,
                          ]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();
                          return haystack.includes(query);
                        });
                      const total = filtered.length;
                      const totalPages = Math.max(1, Math.ceil(total / CLIENT_PAGE_SIZE));
                      const currentPage = Math.min(clientPage, totalPages);
                      const start = (currentPage - 1) * CLIENT_PAGE_SIZE;
                      const pageItems = filtered.slice(start, start + CLIENT_PAGE_SIZE);

                      return (
                        <>
                          {pageItems.map((c) => {
                            const isSelected = selectedClientId === c.id;
                            return (
                              <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                <div className="min-w-0 pr-3">
                                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{c.client_name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {c.contact_person || 'No contact person'}
                                    {c.mobile_no ? ` • ${c.mobile_no}` : ''}
                                    {c.email_address ? ` • ${c.email_address}` : ''}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-semibold">Selected</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleClientSelect(c.id);
                                      setClientPickerOpen(false);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#0E8F79] hover:bg-[#0B7A68] text-white text-sm font-medium transition-colors"
                                  >
                                    Select
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {total === 0 && (
                            <div className="px-4 py-10 text-sm text-center text-gray-500">No clients found.</div>
                          )}

                          {total > CLIENT_PAGE_SIZE && (
                            <div className="px-4 py-3 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/50">
                              <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setClientPage((p) => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClientPage((p) => Math.min(totalPages, p + 1))}
                                  disabled={currentPage >= totalPages}
                                  className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        , document.body)}

        {/* Section 2: Product Information */}
        {currentStep === 1 && (
          <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>2. Product Details</h3>
          {errors['product'] && <p className="text-red-500 text-xs mb-3 -mt-4">{errorMsgs['product'] || 'Please complete product details.'}</p>}

          {/* New / Existing product toggle */}
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => { setIsExistingProduct(false); setSelectedProductId(null); setErrors((p) => ({ ...p, product: false, product_name: false, brand: false, model_name: false, serial_no: false, version_no: false, date_purchased: false, salesNo: false, device_equipment: false, projectTitle: false })); }}
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
              onClick={() => { setIsExistingProduct(true); setNewProductInfo({ device_equipment: '', product_name: '', brand: '', model_name: '', serial_no: '', version_no: '', date_purchased: '', has_warranty: false }); setErrors((p) => ({ ...p, product: false, product_name: false, brand: false, model_name: false, serial_no: false, version_no: false, date_purchased: false, salesNo: false, device_equipment: false, projectTitle: false })); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isExistingProduct
                  ? 'bg-[#0E8F79] text-white border-[#0E8F79]'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              Existing Product
            </button>
          </div>

          <div className="mb-4">
            <label className={labelCls}>Project Title <span className="text-red-500 ml-1">*</span></label>
            <input type="text" placeholder="Project title or reference" value={projectTitle} onChange={(e) => { setProjectTitle(e.target.value); if (e.target.value.trim()) { setErrors((p) => ({ ...p, projectTitle: false })); setErrorMsgs((p) => ({ ...p, projectTitle: '' })); } }} className={`${inputCls} ${errors['projectTitle'] ? errorRing : ''}`} />
            {errors['projectTitle'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['projectTitle'] || 'Project Title is required'}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isExistingProduct ? (
              <>
                <div>
                  <label className={labelCls}>Device / Equipment <span className="text-red-500 ml-1">*</span></label>
                  <div className="relative">
                    <button type="button" onClick={() => { setDeviceModalOpen(true); setErrors((p) => ({ ...p, device_equipment: false })); }} className={`w-full text-left px-4 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] ${newProductInfo.device_equipment ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'} ${errors['device_equipment'] ? errorRing : ''}`}>
                      {newProductInfo.device_equipment || 'Select Device / Equipment'}
                    </button>
                    <button type="button" onClick={() => { setDeviceModalOpen(true); setErrors((p) => ({ ...p, device_equipment: false })); }} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-[#0E8F79] text-white text-sm">Select</button>
                  </div>
                  {errors['device_equipment'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['device_equipment'] || 'Device / Equipment is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Product <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" placeholder="e.g. ZK-K40" value={newProductInfo.product_name} onChange={(e) => { setNewProductInfo((p) => ({ ...p, product_name: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, product_name: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['product_name'] ? errorRing : ''}`} />
                  {errors['product_name'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['product_name'] || 'Product name is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Brand <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" placeholder="e.g. ZKTeco" value={newProductInfo.brand} onChange={(e) => { setNewProductInfo((p) => ({ ...p, brand: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, brand: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['brand'] ? errorRing : ''}`} />
                  {errors['brand'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['brand'] || 'Brand is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Model <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" placeholder="e.g. K40" value={newProductInfo.model_name} onChange={(e) => { setNewProductInfo((p) => ({ ...p, model_name: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, model_name: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['model_name'] ? errorRing : ''}`} />
                  {errors['model_name'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['model_name'] || 'Model is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Serial No. <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" placeholder="e.g. SN123456" value={newProductInfo.serial_no} onChange={(e) => { setNewProductInfo((p) => ({ ...p, serial_no: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, serial_no: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['serial_no'] ? errorRing : ''}`} />
                  {errors['serial_no'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['serial_no'] || 'Serial No. is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Version No. <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" placeholder="e.g. FW 6.60" value={newProductInfo.version_no} onChange={(e) => { setNewProductInfo((p) => ({ ...p, version_no: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, version_no: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['version_no'] ? errorRing : ''}`} />
                  {errors['version_no'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['version_no'] || 'Version No. is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Date Purchased <span className="text-red-500 ml-1">*</span></label>
                  <input type="date" value={newProductInfo.date_purchased} onChange={(e) => { setNewProductInfo((p) => ({ ...p, date_purchased: e.target.value })); if (e.target.value) setErrors((p) => ({ ...p, date_purchased: false })); }} className={`${inputCls} ${errors['date_purchased'] ? errorRing : ''}`} />
                  {errors['date_purchased'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['date_purchased'] || 'Date Purchased is required.'}</p>}
                </div>
                <div>
                  <label className={labelCls}>Warranty <span className="text-red-500 ml-1">*</span></label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setNewProductInfo((p) => ({ ...p, has_warranty: true }))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${newProductInfo.has_warranty ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>With Warranty</button>
                    <button type="button" onClick={() => setNewProductInfo((p) => ({ ...p, has_warranty: false }))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${!newProductInfo.has_warranty ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>Without Warranty</button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Sales / Invoice No. <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" placeholder="e.g. INV-2025-001" value={salesNo} onChange={(e) => { setSalesNo(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, salesNo: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['salesNo'] ? errorRing : ''}`} />
                  {errors['salesNo'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['salesNo'] || 'Sales / Invoice No. is required.'}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className={labelCls}>Select Product (optional)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProductPickerOpen(true)}
                      className={`${inputCls} text-left`}
                    >
                      {selectedProduct
                        ? `${selectedProduct.product_name || selectedProduct.device_equipment || 'Unnamed'}${selectedProduct.brand ? ` | ${selectedProduct.brand}` : ''}${selectedProduct.model_name ? ` | ${selectedProduct.model_name}` : ''}${selectedProduct.serial_no ? ` | S/N: ${selectedProduct.serial_no}` : ''}`
                        : 'Select a product'}
                    </button>
                    {selectedProductId && (
                      <button
                        type="button"
                        onClick={() => setSelectedProductId(null)}
                        className="px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                {selectedProduct && (
                  <>
                    <div>
                      <label className={labelCls}>Device / Equipment</label>
                      <div className="relative">
                        <button type="button" onClick={() => { setDeviceModalOpen(true); setErrors((p) => ({ ...p, device_equipment: false })); }} className={`w-full text-left px-4 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] ${newProductInfo.device_equipment ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'} ${errors['device_equipment'] ? errorRing : ''}`}>
                          {newProductInfo.device_equipment || 'Select Device / Equipment'}
                        </button>
                        <button type="button" onClick={() => { setDeviceModalOpen(true); setErrors((p) => ({ ...p, device_equipment: false })); }} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-[#0E8F79] text-white text-sm">Select</button>
                      </div>
                      {errors['device_equipment'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['device_equipment'] || 'Device / Equipment is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Product</label>
                      <input type="text" placeholder="e.g. ZK-K40" value={newProductInfo.product_name} onChange={(e) => { setNewProductInfo((p) => ({ ...p, product_name: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, product_name: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['product_name'] ? errorRing : ''}`} />
                      {errors['product_name'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['product_name'] || 'Product name is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Brand</label>
                      <input type="text" placeholder="e.g. ZKTeco" value={newProductInfo.brand} onChange={(e) => { setNewProductInfo((p) => ({ ...p, brand: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, brand: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['brand'] ? errorRing : ''}`} />
                      {errors['brand'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['brand'] || 'Brand is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Model</label>
                      <input type="text" placeholder="e.g. K40" value={newProductInfo.model_name} onChange={(e) => { setNewProductInfo((p) => ({ ...p, model_name: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, model_name: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['model_name'] ? errorRing : ''}`} />
                      {errors['model_name'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['model_name'] || 'Model is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Serial No.</label>
                      <input type="text" placeholder="e.g. SN123456" value={newProductInfo.serial_no} onChange={(e) => { setNewProductInfo((p) => ({ ...p, serial_no: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, serial_no: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['serial_no'] ? errorRing : ''}`} />
                      {errors['serial_no'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['serial_no'] || 'Serial No. is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Version No.</label>
                      <input type="text" placeholder="e.g. FW 6.60" value={newProductInfo.version_no} onChange={(e) => { setNewProductInfo((p) => ({ ...p, version_no: e.target.value })); if (e.target.value.trim()) setErrors((p) => ({ ...p, version_no: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['version_no'] ? errorRing : ''}`} />
                      {errors['version_no'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['version_no'] || 'Version No. is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Date Purchased</label>
                      <input type="date" value={newProductInfo.date_purchased} onChange={(e) => { setNewProductInfo((p) => ({ ...p, date_purchased: e.target.value })); if (e.target.value) setErrors((p) => ({ ...p, date_purchased: false })); }} className={`${inputCls} ${errors['date_purchased'] ? errorRing : ''}`} />
                      {errors['date_purchased'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['date_purchased'] || 'Date Purchased is required.'}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Warranty</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setNewProductInfo((p) => ({ ...p, has_warranty: true }))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${newProductInfo.has_warranty ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>With Warranty</button>
                        <button type="button" onClick={() => setNewProductInfo((p) => ({ ...p, has_warranty: false }))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${!newProductInfo.has_warranty ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>Without Warranty</button>
                      </div>
                    </div>
                    {selectedProduct?.others && (
                      <div className="md:col-span-2">
                        <label className={labelCls}>Others</label>
                        <textarea value={selectedProduct.others} rows={2} className={`${inputCls} resize-none`} readOnly />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className={labelCls}>Sales / Invoice No.</label>
                      <input type="text" placeholder="e.g. INV-2025-001" value={salesNo} onChange={(e) => { setSalesNo(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, salesNo: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['salesNo'] ? errorRing : ''}`} />
                      {errors['salesNo'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['salesNo'] || 'Sales / Invoice No. is required.'}</p>}
                      <div className="mt-3 flex justify-end">
                        <button type="button" onClick={handleSaveProductDetails} disabled={!selectedProductId || savingProductDetails} className={`ml-3 px-4 py-2 rounded-lg text-sm ${savingProductDetails ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-[#0E8F79] text-white'}`}>
                          {savingProductDetails ? 'Saving...' : 'Save product details'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {!selectedProduct && (
                  <div className="md:col-span-2">
                    <label className={labelCls}>Sales / Invoice No.</label>
                    <input type="text" placeholder="e.g. INV-2025-001" value={salesNo} onChange={(e) => { setSalesNo(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, salesNo: false })); }} maxLength={MAX_FIELD} className={`${inputCls} ${errors['salesNo'] ? errorRing : ''}`} />
                    {errors['salesNo'] && <p className="text-red-500 text-xs mt-1">{errorMsgs['salesNo'] || 'Sales / Invoice No. is required.'}</p>}
                  </div>
                )}
              </>
            )}
          </div>
          </Card>
        )}

        {/* Navigation controls for product step */}
        {currentStep === 1 && (
          <div className="flex justify-between gap-3">
            <GreenButton type="button" variant="outline" onClick={goPrev}>Previous</GreenButton>
            <GreenButton type="button" onClick={goNext}>Next</GreenButton>
          </div>
        )}

        {productPickerOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setProductPickerOpen(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Select Product (optional)</h4>
                <button type="button" onClick={() => setProductPickerOpen(false)} className="px-3 py-1 rounded bg-[#0E8F79] text-white text-sm">Close</button>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by product, device, brand, model, or serial number..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                />
                {selectedProductId && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductId(null)}
                    className="px-3 py-2 rounded border bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 text-sm"
                  >
                    Use none
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(() => {
                  const query = productSearch.trim().toLowerCase();
                  const filtered = products
                    .filter((p) => p.is_active)
                    .filter((p) => {
                      if (!query) return true;
                      const haystack = [
                        p.product_name,
                        p.device_equipment,
                        p.brand,
                        p.model_name,
                        p.serial_no,
                        p.sales_no,
                      ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();
                      return haystack.includes(query);
                    });

                  const total = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
                  const currentPage = Math.min(productPage, totalPages);
                  const start = (currentPage - 1) * PRODUCT_PAGE_SIZE;
                  const pageItems = filtered.slice(start, start + PRODUCT_PAGE_SIZE);

                  return (
                    <>
                      {pageItems.map((p) => {
                        const isSelected = selectedProductId === p.id;
                        return (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                {p.product_name || p.device_equipment || 'Unnamed product'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {p.device_equipment || 'No equipment'}
                                {p.brand ? ` • ${p.brand}` : ''}
                                {p.model_name ? ` • ${p.model_name}` : ''}
                                {p.serial_no ? ` • S/N: ${p.serial_no}` : ''}
                              </div>
                            </div>
                            {isSelected ? (
                              <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Selected</button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setProductPickerOpen(false);
                                }}
                                className="px-3 py-1 rounded bg-[#0E8F79] text-white text-sm"
                              >
                                Select
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {total === 0 && (
                        <div className="text-sm text-gray-500">No products found.</div>
                      )}

                      {total > PRODUCT_PAGE_SIZE && (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className={`px-2 py-1 rounded border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`}
                            >
                              Prev
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductPage((p) => Math.min(totalPages, p + 1))}
                              disabled={currentPage >= totalPages}
                              className={`px-2 py-1 rounded border ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        , document.body)}

        {/* Section 3: Type of Service (now includes Preferred Support and Description) */}
        {currentStep === 2 && (
          <>
            <Card className="border-l-4 border-l-[#3BC25B]">
            <h3 className={sectionHeaderCls}>3. Type of Service <span className="text-red-500 ml-1">*</span></h3>
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

            <Card className="border-l-4 border-l-[#3BC25B]">
              <h3 className={sectionHeaderCls}>4. Preferred Type of Support <span className="text-red-500 ml-1">*</span></h3>
              {errors['supportType'] && <p className="text-red-500 text-xs mb-3 -mt-4">{errorMsgs['supportType'] || 'Please select a support type'}</p>}
              <div className="flex flex-wrap gap-4">
                {['Remote / Online', 'Onsite', 'Chat', 'Call'].map((type) => (
                  <button key={type} type="button" onClick={() => { setSupportType((prev) => prev === type ? '' : type); setErrors((p) => ({ ...p, supportType: false })); }} className={`px-6 py-3 rounded-full text-sm font-medium transition-all border ${supportType === type ? 'bg-[#0E8F79] text-white border-[#0E8F79] shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>{type}</button>
                ))}
              </div>
            </Card>

            <Card className="border-l-4 border-l-[#3BC25B]">
              <h3 className={sectionHeaderCls}>5. Description of Problem <span className="text-red-500 ml-1">*</span></h3>
              <textarea rows={8} value={description} maxLength={MAX_DESCRIPTION} onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) { setErrors((p) => ({ ...p, description: false })); setErrorMsgs((p) => ({ ...p, description: '' })); } }} className={`${inputCls} resize-none ${errors['description'] ? errorRing : ''}`} placeholder="Please describe the problem in detail. Include any error messages, steps to reproduce, and when the issue started..." />
              <div className="flex justify-between mt-1">
                {errors['description'] ? <p className="text-red-500 text-xs">{errorMsgs['description'] || 'This field is required'}</p> : <span />}
                <span className="text-xs text-gray-400">{description.length}/{MAX_DESCRIPTION}</span>
              </div>
            </Card>
          </>
        )}

        {currentStep === 2 && (
          <div className="flex justify-between gap-3">
            <GreenButton type="button" variant="outline" onClick={goPrev}>Previous</GreenButton>
            <GreenButton type="button" onClick={goNext}>Next</GreenButton>
          </div>
        )}

        {/* Support & Description moved into step 3 (rendered above). */}

        {/* Section 5: Review & Submit */}
        {currentStep === 3 && (
          <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className={sectionHeaderCls}>5. Review & Submit</h3>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
            {[
              ['STF No.', stfNo],
              ['Client', contactValues.client],
              ['Contact Person', contactValues.contactPerson],
              ['Mobile', contactValues.mobile],
              ['Landline', contactValues.landline || '—'],
              ['Email', email || '—'],
              ['Project Title', projectTitle || '—'],
              ['Product', isExistingProduct ? (selectedProduct ? selectedProduct.product_name || selectedProduct.device_equipment : '—') : (newProductInfo.product_name || '—')],
              ['Type of Service', serviceType === 'Others' ? `Others — ${serviceOthersText}` : serviceType || '—'],
              ['Support Type', supportType || '—'],
              ['Description', description || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-gray-500 dark:text-gray-400 w-36 shrink-0 font-medium">{label}:</span>
                <span className="text-gray-900 dark:text-white break-words">{value}</span>
              </div>
            ))}
          </div>
          </Card>
        )}

        {currentStep === 3 && (
          <div className="flex justify-between items-center pt-4">
            <GreenButton type="button" variant="outline" onClick={goPrev}>Previous</GreenButton>
            <div className="flex-1 mx-4 text-center text-xs text-gray-500">By submitting, you agree to our support terms and conditions.</div>
            <GreenButton type="submit" className="py-3 px-6 text-lg shadow-lg shadow-green-500/20">Submit Service Ticket and Call Client</GreenButton>
          </div>
        )}
      </form>

      {/* Modal Flow: calling → ongoing → priority → assign */}
      {modalStep !== 'none' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">

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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                {/* Call events summary shown after call completed */}
                {callCompleted && (
                  <div className="mt-4 bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 text-sm">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Call Log Preview</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                        <div>
                          <div className="font-medium">Call Connected</div>
                          <div className="text-xs text-gray-500">{callStartTime ? callStartTime.toLocaleString() : '—'} • {contactValues.mobile || '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        <div>
                          <div className="font-medium">Ongoing</div>
                          <div className="text-xs text-gray-500">Duration: {formatCallDuration(callTimer)}</div>
                        </div>
                      </div>
                      {holdOffset > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1" />
                          <div>
                            <div className="font-medium">On Hold</div>
                            <div className="text-xs text-gray-500">Total hold: {formatCallDuration(Math.floor(holdOffset / 1000))}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                        <div>
                          <div className="font-medium">End Call</div>
                          <div className="text-xs text-gray-500">{callEndTime ? callEndTime.toLocaleString() : '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
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
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${priorityBadgeClass(t.priority)}`}>
                                    {formatPriorityLabel(t.priority)}
                                  </span>
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
                  {canAssignExternal && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      </div>
                      <button onClick={handleAssignExternal} disabled={isAssigning} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        {isAssigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><ExternalLink className="w-4 h-4" /> Assign to External</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      , document.body)}
    </div>
  );
}

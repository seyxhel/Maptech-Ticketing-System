import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchDeviceEquipment,
  fetchClients,
  type Product,
  type DeviceEquipment,
  type ClientRecord,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  client_id: '' as string | number,
  project_title: '',
  product_name: '',
  sales_no: '',
  brand: '',
  model_name: '',
  device_equipment: '',
  device_equipment_id: '' as string | number,
  version_no: '',
  firmware_version: '',
  software_name: '',
  software_version: '',
  software_vendor: '',
  software_license_key: '',
  software_metadata: '',
  date_purchased: '',
  serial_no: '',
  has_warranty: false,
  is_active: true,
};

export default function Products() {
  const { user } = useAuth();
  const canDelete = user?.role !== 'sales';
  const [products, setProducts] = useState<Product[]>([]);
  const [deviceEquipment, setDeviceEquipment] = useState<DeviceEquipment[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [devicePage, setDevicePage] = useState(1);
  const DEVICE_PAGE_SIZE = 8;

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [data, list, clientList] = await Promise.all([fetchProducts(), fetchDeviceEquipment(), fetchClients()]);
      setProducts(data);
      setDeviceEquipment(list);
      setClients(clientList.filter((c) => c.is_active));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch products.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Filtering
  const filtered = products.filter((p) => {
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && p.is_active) ||
      (statusFilter === 'Inactive' && !p.is_active);
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (p.product_name || '').toLowerCase().includes(q) ||
      (p.project_title || '').toLowerCase().includes(q) ||
      (p.sales_no || '').toLowerCase().includes(q) ||
      (p.client_detail?.client_name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.model_name || '').toLowerCase().includes(q) ||
      (p.serial_no || '').toLowerCase().includes(q) ||
      (p.firmware_version || '').toLowerCase().includes(q) ||
      (p.software_name || '').toLowerCase().includes(q) ||
      (p.software_version || '').toLowerCase().includes(q) ||
      (p.software_vendor || '').toLowerCase().includes(q) ||
      (p.software_license_key || '').toLowerCase().includes(q) ||
      (p.software_metadata || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Modal helpers
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ ...EMPTY_FORM });
    setFieldErrors({});
    setDeviceSearch('');
    setDevicePage(1);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      client_id: product.client || '',
      project_title: product.project_title || '',
      product_name: product.product_name || '',
      sales_no: product.sales_no || '',
      brand: product.brand || '',
      model_name: product.model_name || '',
      device_equipment: product.device_equipment || '',
      version_no: product.version_no || '',
      firmware_version: product.firmware_version || '',
      software_name: product.software_name || '',
      software_version: product.software_version || '',
      software_vendor: product.software_vendor || '',
      software_license_key: product.software_license_key || '',
      software_metadata: product.software_metadata || '',
      date_purchased: product.date_purchased || '',
      serial_no: product.serial_no || '',
      has_warranty: product.has_warranty,
      is_active: product.is_active,
      device_equipment_id: product.category || '',
    });
    setFieldErrors({});
    setDeviceSearch('');
    setDevicePage(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDeviceModalOpen(false);
    setEditingProduct(null);
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.product_name.trim()) errors.product_name = 'Product name is required.';
    if (!formData.client_id) errors.client_id = 'Client is required.';
    if (!formData.project_title.trim()) errors.project_title = 'Project title is required.';
    if (!formData.device_equipment_id && !formData.device_equipment.trim()) errors.device_equipment = 'Device/Equipment (Category) is required.';
    if (!formData.brand.trim()) errors.brand = 'Brand is required.';
    if (!formData.model_name.trim()) errors.model_name = 'Model is required.';
    if (!formData.version_no.trim()) errors.version_no = 'Version number is required.';
    if (!formData.date_purchased) errors.date_purchased = 'Date purchased is required.';
    if (!formData.serial_no.trim()) errors.serial_no = 'Serial number is required.';
    if (!formData.sales_no.trim()) errors.sales_no = 'Sales / Invoice No. is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProduct = async (keepOpenAfterCreate = false) => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: Partial<Product> = {
        client: Number(formData.client_id),
        project_title: formData.project_title.trim(),
        product_name: formData.product_name.trim(),
        brand: formData.brand.trim(),
        model_name: formData.model_name.trim(),
        device_equipment: formData.device_equipment.trim(),
        version_no: formData.version_no.trim(),
        firmware_version: formData.firmware_version.trim(),
        software_name: formData.software_name.trim(),
        software_version: formData.software_version.trim(),
        software_vendor: formData.software_vendor.trim(),
        software_license_key: formData.software_license_key.trim(),
        software_metadata: formData.software_metadata.trim(),
        date_purchased: formData.date_purchased || null,
        serial_no: formData.serial_no.trim(),
        sales_no: formData.sales_no.trim(),
        has_warranty: formData.has_warranty,
        is_active: formData.is_active,
        category: formData.device_equipment_id ? Number(formData.device_equipment_id) : null,
      };

      const selectedDevice = formData.device_equipment_id
        ? deviceEquipment.find((item) => item.id === Number(formData.device_equipment_id))
        : null;
      payload.device_equipment = selectedDevice ? selectedDevice.name : formData.device_equipment.trim();

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(`"${updated.product_name || updated.device_equipment}" updated successfully.`);
        closeModal();
        return;
      }

      const created = await createProduct(payload);
      setProducts((prev) => [...prev, created]);
      toast.success(`"${created.product_name || created.device_equipment}" created successfully.`);

      if (keepOpenAfterCreate) {
        // Keep client/project for faster repeated entries.
        setFormData((prev) => ({
          ...EMPTY_FORM,
          client_id: prev.client_id,
          project_title: prev.project_title,
        }));
        setFieldErrors({});
      } else {
        closeModal();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProduct(false);
  };

  const handleSaveAndAddAnother = async () => {
    await saveProduct(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      setDeleteTarget(null);
      toast.error('Sales users are not allowed to delete products.');
      return;
    }
    setSubmitting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.product_name || deleteTarget.device_equipment}" deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const updated = await updateProduct(product.id, { is_active: !product.is_active });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`"${updated.product_name || updated.device_equipment}" ${updated.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage the product/equipment catalog</p>
        </div>
        <div className="flex gap-2">
          <GreenButton variant="outline" onClick={loadProducts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </GreenButton>
          <GreenButton onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </GreenButton>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
            />
          </div>
          <div className="flex gap-2">
            {(['All', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  statusFilter === s
                    ? 'bg-[#0E8F79] text-white border-[#0E8F79]'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-6 pb-2">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium">Product Name</th>
                <th className="pb-3 font-medium">Client</th>
                <th className="pb-3 font-medium">Project Title</th>
                <th className="pb-3 font-medium">Brand</th>
                <th className="pb-3 font-medium">Model</th>
                <th className="pb-3 font-medium">Serial No.</th>
                <th className="pb-3 font-medium text-center">Warranty</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No products found.
                  </td>
                </tr>
              ) : (
                paged.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      {product.product_name || product.device_equipment || '—'}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{product.client_detail?.client_name || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{product.project_title || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{product.brand || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{product.model_name || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{product.serial_no || '—'}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.has_warranty
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {product.has_warranty ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          product.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        }`}
                        title={`Click to ${product.is_active ? 'deactivate' : 'activate'}`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewingProduct(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0E8F79] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 pb-6 text-sm text-gray-500 dark:text-gray-400">
            <span>Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg ${page === currentPage ? 'bg-[#3BC25B] text-white' : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{page}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.project_title} onChange={(e) => setFormData({ ...formData, project_title: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.project_title ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. CCTV Upgrade 2026" />
                {fieldErrors.project_title && <p className="mt-1 text-xs text-red-500">{fieldErrors.project_title}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client <span className="text-red-500">*</span></label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.client_id ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.client_name}</option>
                    ))}
                  </select>
                  {fieldErrors.client_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.client_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.product_name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. Laptop" />
                  {fieldErrors.product_name && <p className="mt-1 text-xs text-red-500">{fieldErrors.product_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device / Equipment (Category) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceModalOpen(true);
                        setFieldErrors((prev) => ({ ...prev, device_equipment: '' }));
                      }}
                      className={`w-full text-left px-3 py-2 pr-20 border rounded-lg text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${formData.device_equipment ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'} ${fieldErrors.device_equipment ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
                    >
                      {formData.device_equipment || 'Select Device / Equipment (Category)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceModalOpen(true);
                        setFieldErrors((prev) => ({ ...prev, device_equipment: '' }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-[#0E8F79] text-white text-xs"
                    >
                      Select
                    </button>
                  </div>
                  {fieldErrors.device_equipment && <p className="mt-1 text-xs text-red-500">{fieldErrors.device_equipment}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.brand ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. Dell" />
                  {fieldErrors.brand && <p className="mt-1 text-xs text-red-500">{fieldErrors.brand}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.model_name} onChange={(e) => setFormData({ ...formData, model_name: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.model_name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. Latitude 5520" />
                  {fieldErrors.model_name && <p className="mt-1 text-xs text-red-500">{fieldErrors.model_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version No. <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.version_no} onChange={(e) => setFormData({ ...formData, version_no: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.version_no ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. v2.1" />
                  {fieldErrors.version_no && <p className="mt-1 text-xs text-red-500">{fieldErrors.version_no}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Purchased <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.date_purchased} onChange={(e) => setFormData({ ...formData, date_purchased: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.date_purchased ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
                  {fieldErrors.date_purchased && <p className="mt-1 text-xs text-red-500">{fieldErrors.date_purchased}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial No. <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.serial_no} onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.serial_no ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. SN123456" />
                  {fieldErrors.serial_no && <p className="mt-1 text-xs text-red-500">{fieldErrors.serial_no}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales / Invoice No. <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.sales_no} onChange={(e) => setFormData({ ...formData, sales_no: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.sales_no ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. INV-2026-001" />
                  {fieldErrors.sales_no && <p className="mt-1 text-xs text-red-500">{fieldErrors.sales_no}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firmware Version</label>
                  <input type="text" value={formData.firmware_version} onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="e.g. 2.3.1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software Name</label>
                  <input type="text" value={formData.software_name} onChange={(e) => setFormData({ ...formData, software_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="e.g. Access Control Pro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software Version</label>
                  <input type="text" value={formData.software_version} onChange={(e) => setFormData({ ...formData, software_version: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="e.g. 5.12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software Vendor</label>
                  <input type="text" value={formData.software_vendor} onChange={(e) => setFormData({ ...formData, software_vendor: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="e.g. Maptech" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software License Key</label>
                  <input type="text" value={formData.software_license_key} onChange={(e) => setFormData({ ...formData, software_license_key: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="Optional" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software Metadata</label>
                  <textarea value={formData.software_metadata} onChange={(e) => setFormData({ ...formData, software_metadata: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="Optional notes" />
                </div>
              </div>

              {/* Warranty toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formData.has_warranty} onChange={(e) => setFormData({ ...formData, has_warranty: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3BC25B] rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3BC25B]"></div>
                </label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Warranty</span>
              </div>

              {/* Active toggle (only when editing) */}
              {editingProduct && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3BC25B] rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3BC25B]"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <GreenButton type="button" variant="outline" onClick={closeModal} disabled={submitting}>Cancel</GreenButton>
                {!editingProduct && (
                  <GreenButton type="button" variant="outline" onClick={handleSaveAndAddAnother} disabled={submitting}>
                    Create & Add Another
                  </GreenButton>
                )}
                <GreenButton type="submit" isLoading={submitting} disabled={submitting}>
                  {editingProduct ? 'Save Changes' : 'Create'}
                </GreenButton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Modal */}
      {viewingProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Details</h2>
              <button onClick={() => setViewingProduct(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Project Title</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.project_title || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Client</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.client_detail?.client_name || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Product</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.product_name || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Device / Equipment</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.device_equipment || viewingProduct.category_detail?.name || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Brand</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.brand || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Model</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.model_name || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Version</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.version_no || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Firmware Version</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.firmware_version || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Software Name</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.software_name || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Software Version</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.software_version || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Software Vendor</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.software_vendor || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Software License Key</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.software_license_key || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Serial No.</p><p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">{viewingProduct.serial_no || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Sales / Invoice No.</p><p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">{viewingProduct.sales_no || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Date Purchased</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.date_purchased ? new Date(viewingProduct.date_purchased).toLocaleDateString() : '—'}</p></div>
              <div className="md:col-span-2"><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Software Metadata</p><p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{viewingProduct.software_metadata || '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Warranty</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.has_warranty ? 'With Warranty' : 'Without Warranty'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</p><p className="text-sm text-gray-900 dark:text-white mt-1">{viewingProduct.is_active ? 'Active' : 'Inactive'}</p></div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deviceModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
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
                  onChange={(e) => {
                    setDeviceSearch(e.target.value);
                    setDevicePage(1);
                  }}
                  placeholder="Search device/equipment (category)..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
                />
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(() => {
                    const filtered = deviceEquipment
                      .filter((d) => d.is_active !== false)
                      .filter((d) => (d.name || '').toLowerCase().includes(deviceSearch.toLowerCase()));
                    const total = filtered.length;
                    const totalPages = Math.max(1, Math.ceil(total / DEVICE_PAGE_SIZE));
                    const currentPage = Math.min(devicePage, totalPages);
                    const start = (currentPage - 1) * DEVICE_PAGE_SIZE;
                    const pageItems = filtered.slice(start, start + DEVICE_PAGE_SIZE);

                    return (
                      <>
                        {pageItems.map((d) => {
                          const title = d.name || 'Unnamed';
                          const isSelected = Number(formData.device_equipment_id) === d.id || (formData.device_equipment || '').toLowerCase() === title.toLowerCase();
                          return (
                            <div key={d.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</div>
                              {isSelected ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-semibold">Selected</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      device_equipment_id: d.id,
                                      device_equipment: title,
                                    }));
                                    setFieldErrors((prev) => ({ ...prev, device_equipment: '' }));
                                    setDeviceModalOpen(false);
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
                          <div className="px-4 py-10 text-sm text-center text-gray-500">No device/equipment (category) found.</div>
                        )}

                        {total > DEVICE_PAGE_SIZE && (
                          <div className="px-4 py-3 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/50">
                            <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDevicePage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                onClick={() => setDevicePage((p) => Math.min(totalPages, p + 1))}
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
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {canDelete && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Product</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>"{deleteTarget.product_name || deleteTarget.device_equipment}"</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <GreenButton variant="outline" onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</GreenButton>
              <button
                onClick={confirmDelete}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg font-medium px-4 py-2.5 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

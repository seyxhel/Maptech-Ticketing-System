import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchDeviceEquipment,
  createDeviceEquipment,
  updateDeviceEquipment,
  deleteDeviceEquipment,
  type DeviceEquipment as DeviceEquipmentType,
} from '../services/api';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  name: '',
  description: '',
  is_active: true,
};

export function DeviceEquipment() {
  const [deviceEquipment, setDeviceEquipment] = useState<DeviceEquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeviceEquipment, setEditingDeviceEquipment] = useState<DeviceEquipmentType | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<DeviceEquipmentType | null>(null);

  const loadDeviceEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDeviceEquipment();
      setDeviceEquipment(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch device/equipment.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDeviceEquipment(); }, [loadDeviceEquipment]);

  // Filtering
  const filtered = deviceEquipment.filter((c) => {
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && c.is_active) ||
      (statusFilter === 'Inactive' && !c.is_active);
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Modal helpers
  const openAddModal = () => {
    setEditingDeviceEquipment(null);
    setFormData({ ...EMPTY_FORM });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: DeviceEquipmentType) => {
    setEditingDeviceEquipment(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      is_active: item.is_active,
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDeviceEquipment(null);
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Device/Equipment name is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
      };

      if (editingDeviceEquipment) {
        const updated = await updateDeviceEquipment(editingDeviceEquipment.id, payload);
        setDeviceEquipment((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success(`"${updated.name}" updated successfully.`);
      } else {
        const created = await createDeviceEquipment(payload);
        setDeviceEquipment((prev) => [...prev, created]);
        toast.success(`"${created.name}" created successfully.`);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save device/equipment.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteDeviceEquipment(deleteTarget.id);
      setDeviceEquipment((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete device/equipment.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (item: DeviceEquipmentType) => {
    try {
      const updated = await updateDeviceEquipment(item.id, { is_active: !item.is_active });
      setDeviceEquipment((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(`"${updated.name}" ${updated.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading device/equipment...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device/Equipment</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage device/equipment master list</p>
        </div>
        <div className="flex gap-2">
          <GreenButton variant="outline" onClick={loadDeviceEquipment} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </GreenButton>
          <GreenButton onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Device/Equipment
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
              placeholder="Search device/equipment..."
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
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-center">Products</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <FolderTree className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No device/equipment items found.
                  </td>
                </tr>
              ) : (
                paged.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.product_count}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          item.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        }`}
                        title={`Click to ${item.is_active ? 'deactivate' : 'activate'}`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingDeviceEquipment ? 'Edit Device/Equipment' : 'Add Device/Equipment'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device/Equipment Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
                  placeholder="e.g. Wireless Access Points & Switches"
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
                  placeholder="Optional description for this device/equipment item"
                />
              </div>

              {/* Active toggle (only when editing) */}
              {editingDeviceEquipment && (
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
                <GreenButton type="submit" isLoading={submitting} disabled={submitting}>
                  {editingDeviceEquipment ? 'Save Changes' : 'Create'}
                </GreenButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Device/Equipment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
            </p>
            {deleteTarget.product_count > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                This item is linked to {deleteTarget.product_count} product(s). They will be unlinked after deletion.
              </p>
            )}
            <div className="flex justify-end gap-3 mt-4">
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
        </div>
      )}
    </div>
  );
}

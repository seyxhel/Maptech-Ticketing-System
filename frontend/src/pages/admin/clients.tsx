import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Users,
  FileText,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  fetchTickets,
  type ClientRecord,
  type BackendTicket,
} from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { mapStatus, mapPriority } from '../../services/ticketMapper';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  client_name: '',
  contact_person: '',
  landline: '',
  mobile_no: '',
  designation: '',
  department_organization: '',
  email_address: '',
  address: '',
  is_active: true,
  sales_representative: '',
  additional_sales_reps: [] as string[],
};

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);

  // Records view
  const [viewingClient, setViewingClient] = useState<ClientRecord | null>(null);
  const [clientTickets, setClientTickets] = useState<BackendTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClients();
      setClients(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch clients.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  // employees list no longer needed for free-text sales rep inputs

  // Load tickets for a specific client
  const viewRecords = async (client: ClientRecord) => {
    setViewingClient(client);
    setTicketsLoading(true);
    try {
      const allTickets = await fetchTickets();
      // Filter tickets linked to this client record
      const related = allTickets.filter(
        (t) => t.client_record === client.id || t.client?.toLowerCase() === client.client_name.toLowerCase()
      );
      setClientTickets(related);
    } catch {
      toast.error('Failed to load client tickets.');
    } finally {
      setTicketsLoading(false);
    }
  };

  // Filtering
  const filtered = clients.filter((c) => {
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && c.is_active) ||
      (statusFilter === 'Inactive' && !c.is_active);
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.client_name.toLowerCase().includes(q) ||
      (c.contact_person || '').toLowerCase().includes(q) ||
      (c.email_address || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ ...EMPTY_FORM });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (client: ClientRecord) => {
    setEditingClient(client);
    setFormData({
      client_name: client.client_name,
      contact_person: client.contact_person || '',
      landline: client.landline || '',
      mobile_no: client.mobile_no || '',
      designation: client.designation || '',
      department_organization: client.department_organization || '',
      email_address: client.email_address || '',
      address: client.address || '',
      is_active: client.is_active,
      sales_representative: (client as any).sales_representative || '',
      additional_sales_reps: (client as any).additional_sales_reps || [],
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingClient(null); setFieldErrors({}); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.client_name.trim()) errors.client_name = 'Client name is required.';
    if (!formData.contact_person.trim()) errors.contact_person = 'Contact person is required.';
    if (!formData.designation.trim()) errors.designation = 'Designation is required.';
    if (!formData.mobile_no.trim()) errors.mobile_no = 'Mobile number is required.';
    if (!formData.department_organization.trim()) errors.department_organization = 'Department / Organization is required.';
    if (!formData.sales_representative?.trim()) errors.sales_representative = 'Sales Representative is required.';
    if (!formData.email_address.trim()) {
      errors.email_address = 'Email address is required.';
    } else {
      const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.([^<>()[\]\\.,;:\s@\"]+))*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
      if (!re.test(formData.email_address)) errors.email_address = 'Enter a valid email address.';
    }
    if (!formData.address.trim()) errors.address = 'Full address is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        client_name: formData.client_name.trim(),
        contact_person: formData.contact_person.trim(),
        landline: formData.landline.trim(),
        mobile_no: formData.mobile_no.trim(),
        designation: formData.designation.trim(),
        department_organization: formData.department_organization.trim(),
        email_address: formData.email_address.trim(),
        address: formData.address.trim(),
        is_active: formData.is_active,
        sales_representative: (formData as any).sales_representative?.trim() || '',
        additional_sales_reps: (formData as any).additional_sales_reps || [],
      };
      if (editingClient) {
        const updated = await updateClient(editingClient.id, payload);
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success(`"${updated.client_name}" updated successfully.`);
      } else {
        const created = await createClient(payload);
        setClients((prev) => [...prev, created]);
        toast.success(`"${created.client_name}" created successfully.`);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save client.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteClient(deleteTarget.id);
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.client_name}" deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete client.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (client: ClientRecord) => {
    try {
      const updated = await updateClient(client.id, { is_active: !client.is_active });
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(`"${updated.client_name}" ${updated.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading clients...</span>
      </div>
    );
  }

  // ── Records View (Client Ticket History) ──
  if (viewingClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewingClient(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingClient.client_name}</h1>
            <p className="text-gray-500 dark:text-gray-400">Client Records &amp; Ticket History</p>
          </div>
        </div>

        {/* Client Details Card */}
        <Card accent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Contact Person', value: viewingClient.contact_person },
              { label: 'Mobile', value: viewingClient.mobile_no },
              { label: 'Landline', value: viewingClient.landline },
              { label: 'Email', value: viewingClient.email_address },
              { label: 'Designation', value: viewingClient.designation },
              { label: 'Department', value: viewingClient.department_organization },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</span>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
              </div>
            ))}
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Address</span>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5">{viewingClient.address || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Tickets Table */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-6 pt-6">
            <FileText className="w-5 h-5 inline mr-2 text-[#3BC25B]" />
            Ticket History ({clientTickets.length})
          </h3>
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3BC25B]"></div>
              <span className="ml-2 text-sm text-gray-400">Loading tickets...</span>
            </div>
          ) : clientTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              No tickets found for this client.
            </div>
          ) : (
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-3 font-medium">STF No.</th>
                    <th className="pb-3 font-medium">Service Type</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Progress</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {clientTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-[#0E8F79] dark:text-green-400 font-medium">{t.stf_no}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">{t.type_of_service_detail?.name || t.type_of_service_others || '—'}</td>
                      <td className="py-3">{t.priority && <PriorityBadge priority={mapPriority(t.priority)} />}</td>
                      <td className="py-3"><StatusBadge status={mapStatus(t.status, t.assigned_to)} /></td>
                      <td className="py-3 text-gray-600 dark:text-gray-300 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-[#3BC25B] rounded-full" style={{ width: `${t.progress_percentage ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{t.progress_percentage ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate(`/admin/ticket-details?stf=${encodeURIComponent(t.stf_no)}`)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-[#0E8F79] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          title="View full ticket"
                          aria-label={`View ${t.stf_no}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage client records and view ticket history</p>
        </div>
        <div className="flex gap-2">
          <GreenButton variant="outline" onClick={loadClients} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </GreenButton>
          <GreenButton onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Client
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
              placeholder="Search clients..."
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
                <th className="pb-3 font-medium">Client Name</th>
                <th className="pb-3 font-medium">Contact Person</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Mobile</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No clients found.
                  </td>
                </tr>
              ) : (
                paged.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{client.client_name}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{client.contact_person || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300 text-xs">{client.email_address || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{client.mobile_no || '—'}</td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleActive(client)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          client.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        }`}
                      >
                        {client.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => viewRecords(client)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0E8F79] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="View Records">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(client)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(client)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
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
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingClient ? 'Edit Client' : 'Add Client'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.client_name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. Maptech Inc." autoFocus />
                {fieldErrors.client_name && <p className="mt-1 text-xs text-red-500">{fieldErrors.client_name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.contact_person ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. Juan Dela Cruz" />
                  {fieldErrors.contact_person && <p className="mt-1 text-xs text-red-500">{fieldErrors.contact_person}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.designation ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. IT Manager" />
                  {fieldErrors.designation && <p className="mt-1 text-xs text-red-500">{fieldErrors.designation}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile No. <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.mobile_no} onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.mobile_no ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. 09171234567" />
                  {fieldErrors.mobile_no && <p className="mt-1 text-xs text-red-500">{fieldErrors.mobile_no}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Landline No.</label>
                  <input type="text" value={formData.landline} onChange={(e) => setFormData({ ...formData, landline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" placeholder="e.g. (02) 1234-5678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={formData.email_address} onChange={(e) => setFormData({ ...formData, email_address: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.email_address ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. client@email.com" />
                  {fieldErrors.email_address && <p className="mt-1 text-xs text-red-500">{fieldErrors.email_address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department / Organization <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.department_organization} onChange={(e) => setFormData({ ...formData, department_organization: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.department_organization ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="e.g. Information Technology" />
                  {fieldErrors.department_organization && <p className="mt-1 text-xs text-red-500">{fieldErrors.department_organization}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Address <span className="text-red-500">*</span></label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] resize-none ${fieldErrors.address ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} placeholder="Full address..." />
                {fieldErrors.address && <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Representative <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={(formData as any).sales_representative || ''}
                  onChange={(e) => setFormData({ ...formData, sales_representative: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${fieldErrors.sales_representative ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
                  placeholder="Primary sales representative"
                />
                {fieldErrors.sales_representative && <p className="mt-1 text-xs text-red-500">{fieldErrors.sales_representative}</p>}

                {/* Additional sales reps list */}
                <div className="mt-3 space-y-2">
                  {((formData as any).additional_sales_reps || []).map((rep: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rep || ''}
                        onChange={(e) => {
                          const arr = [...((formData as any).additional_sales_reps || [])]; arr[idx] = e.target.value; setFormData({ ...formData, additional_sales_reps: arr });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
                        placeholder="Optional sales rep"
                      />
                      <button type="button" onClick={() => {
                        const arr = [...((formData as any).additional_sales_reps || [])]; arr.splice(idx, 1); setFormData({ ...formData, additional_sales_reps: arr });
                      }} className="inline-flex items-center px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div>
                    <button type="button" onClick={() => {
                      const arr = [...((formData as any).additional_sales_reps || [])]; arr.push(''); setFormData({ ...formData, additional_sales_reps: arr });
                    }} className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200">
                      <Plus className="w-4 h-4" />
                      Add Sales Representative
                    </button>
                  </div>
                </div>
              </div>

              {editingClient && (
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
                  {editingClient ? 'Save Changes' : 'Create'}
                </GreenButton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Client</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>"{deleteTarget.client_name}"</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <GreenButton variant="outline" onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</GreenButton>
              <button onClick={confirmDelete} disabled={submitting} className="inline-flex items-center justify-center rounded-lg font-medium px-4 py-2.5 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
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

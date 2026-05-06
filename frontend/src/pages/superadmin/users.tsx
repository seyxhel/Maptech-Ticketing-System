import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  Search,
  Plus,
  Edit2,
  Lock,
  Unlock,
  X,
  Users,
  Loader2,
  RefreshCw,
  Key,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  validateEmail,
  validatePhone,
  validateName,
  MAX_NAME,
  MAX_EMAIL,
  MAX_PHONE,
} from '../../utils/validation';
import {
  fetchUsers,
  createUser,
  updateUser,
  toggleUserActive,
  adminResetPassword,
  type BackendUser,
  type CreateUserPayload,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface UserAccount {
  id: number;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  role: 'Supervisor' | 'Technical' | 'Sales' | 'Superadmin';
  status: 'Active' | 'Blocked';
}

/** Map a BackendUser to the local UserAccount shape. */
function toUserAccount(u: BackendUser): UserAccount {
  const fullName = [u.first_name, u.middle_name, u.last_name, u.suffix]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');
  const roleMap: Record<string, 'Supervisor' | 'Technical' | 'Sales' | 'Superadmin'> = {
    admin: 'Supervisor',
    employee: 'Technical',
    sales: 'Sales',
    superadmin: 'Superadmin',
  };
  return {
    id: u.id,
    name: fullName || u.username,
    firstName: u.first_name || '',
    middleName: u.middle_name || '',
    lastName: u.last_name || '',
    suffix: u.suffix || '',
    email: u.email,
    phone: u.phone || '',
    role: roleMap[u.role] || 'Technical',
    status: u.is_active ? 'Active' : 'Blocked',
  };
}

function displayName(u: UserAccount): string {
  return u.name;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const ROLE_LABELS: Record<string, string> = {
  technical: 'Technical Staff',
  supervisor: 'Supervisor',
  sales: 'Sales',
  superadmin: 'Superadmin',
  admin: 'Supervisor',
  employee: 'Technical Staff',
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role.toLowerCase()] ?? cap(role);
}

const EMPTY_FORM = {
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',
  email: '',
  contactNumber: '',
  role: 'employee' as 'admin' | 'employee' | 'sales',
};

export default function UserManagement() {
  const { user: authUser } = useAuth();
  const isSuperadmin = authUser?.role === 'superadmin';
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<
    'All' | 'Supervisor' | 'Technical' | 'Sales' | 'Superadmin'>(
    'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [recoveryKeyModal, setRecoveryKeyModal] = useState<{ name: string; key: string } | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Fetch users from backend ──
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data.map(toUserAccount));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch users.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const name = displayName(u).toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || u.email.toLowerCase().includes(term);
    return matchesRole && matchesSearch;
  });

  /* ── modal helpers ────────────────────────────────── */
  const openAddModal = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setNewPassword('');
    setConfirmPassword('');
     setShowNewPassword(false);
     setShowConfirmPassword(false);
     setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      suffix: user.suffix || '',
      email: user.email,
      contactNumber: user.phone || '',
      role: (
        user.role === 'Technical'
          ? 'employee'
          : user.role === 'Sales'
            ? 'sales'
            : 'admin'
      ) as 'admin' | 'employee' | 'sales',
    });
    setNewPassword('');
    setConfirmPassword('');
     setShowNewPassword(false);
     setShowConfirmPassword(false);
    setIsModalOpen(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validate fields ──
    const errs: Record<string, string> = {};
    const lastErr = validateName(formData.lastName, 'Last Name');
    if (lastErr) errs.lastName = lastErr;
    const firstErr = validateName(formData.firstName, 'First Name');
    if (firstErr) errs.firstName = firstErr;
    if (formData.middleName.trim()) {
      const midErr = validateName(formData.middleName, 'Middle Name');
      if (midErr) errs.middleName = midErr;
    }
    const emailErr = validateEmail(formData.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(formData.contactNumber, 'Contact Number');
    if (phoneErr) errs.contactNumber = phoneErr;

    if (editingUser && isSuperadmin) {
      const wantsPasswordUpdate = newPassword.trim().length > 0 || confirmPassword.trim().length > 0;
      if (wantsPasswordUpdate) {
        if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
        if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
         if (newPassword.trim() === '') errs.newPassword = 'New password cannot be empty.';
      }
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted errors.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Update existing user via API
        const payload: Record<string, string> = {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          middle_name: formData.middleName.trim(),
          email: formData.email.trim(),
          phone: formData.contactNumber.trim(),
          role: formData.role.toLowerCase(),
        };
        await updateUser(editingUser.id, payload as never);

        if (isSuperadmin && newPassword.trim()) {
          await adminResetPassword(editingUser.id, newPassword);
        }

        toast.success(`Account for ${formData.firstName} ${formData.lastName} updated successfully.`);
        setIsModalOpen(false);
        await loadUsers();
      } else {
        // Create new user via API
        const payload: CreateUserPayload = {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          middle_name: formData.middleName.trim(),
          email: formData.email.trim(),
          phone: formData.contactNumber.trim(),
          role: formData.role.toLowerCase() as 'employee' | 'admin' | 'sales',
        };
        const created = await createUser(payload);
        setIsModalOpen(false);
        setRecoveryKeyModal({
          name: `${formData.firstName} ${formData.lastName}`,
          key: (created.recovery_key as string) || '',
        });
        setKeyCopied(false);
        toast.success(
          `New ${formData.role} account created for ${formData.firstName} ${formData.lastName}.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
       // Parse backend error codes for specific password issues
       if (msg.includes('password_too_short')) {
         toast.error('Password must be at least 8 characters.');
         setFieldErrors((p) => ({ ...p, newPassword: 'Password must be at least 8 characters.' }));
       } else if (msg.includes('password_compromised') || msg.includes('data breach')) {
         toast.error('This password has been compromised. Please choose a different password.');
         setFieldErrors((p) => ({ ...p, newPassword: 'This password has been compromised. Please choose a different one.' }));
       } else {
         toast.error(msg);
       }
    } finally {
      setSubmitting(false);
    }
  };
  const toggleStatus = async (id: number) => {
    try {
      await toggleUserActive(id);
      await loadUsers(); // Refresh
      const user = users.find((u) => u.id === id);
      if (user) {
        const next = user.status === 'Active' ? 'blocked' : 'activated';
        toast.info(`${user.name} has been ${next}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Toggle failed.';
      toast.error(msg);
    }
  };
  const roleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'supervisor')
    return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    if (r === 'technical')
    return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    if (r === 'sales')
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
    if (r === 'superadmin')
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
    return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  };
  const roleCounts = {
    All: users.length,
    Supervisor: users.filter((u) => u.role === 'Supervisor').length,
    Technical: users.filter((u) => u.role === 'Technical').length,
    Sales: users.filter((u) => u.role === 'Sales').length,
    Superadmin: users.filter((u) => u.role === 'Superadmin').length
  };
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Add, edit, and manage all system accounts
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadUsers}
            title="Refresh"
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <GreenButton onClick={openAddModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Account
          </GreenButton>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
        {
          label: 'Total Users',
          count: users.length,
          cls: 'bg-gray-900 dark:bg-gray-700 text-white'
        },
        {
          label: 'Supervisors',
          count: roleCounts.Supervisor,
          cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
        },
        {
          label: 'Technical Staff',
          count: roleCounts.Technical,
          cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
        },
        {
          label: 'Superadmins',
          count: roleCounts.Superadmin,
          cls: 'bg-amber-50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
        }].
        map((item) =>
        <div key={item.label} className={`rounded-xl p-4 ${item.cls}`}>
            <p className="text-2xl font-bold">{item.count}</p>
            <p className="text-sm mt-1 opacity-80">{item.label}</p>
          </div>
        )}
      </div>

      {/* table card */}
      <Card accent>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap bg-gray-100 dark:bg-gray-700 p-1 rounded-lg gap-1 w-full md:w-auto">
            {(['All', 'Supervisor', 'Technical', 'Sales', 'Superadmin'] as const).map((tab) =>
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${roleFilter === tab ? 'bg-white dark:bg-gray-600 text-[#0E8F79] dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>

                {tab === 'Technical' ? 'Technical Staff' : tab}
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    roleFilter === tab
                      ? 'bg-[#ecfdf5] dark:bg-green-900/40 text-[#0E8F79] dark:text-green-400'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {roleCounts[tab]}
                </span>
              </button>
            )}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Full Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="font-medium">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <Users className="w-8 h-8" />
                      <p className="font-medium">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const name = displayName(user);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#63D44A] to-[#0E8F79] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge(user.role)}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            user.status === 'Active'
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          {user.status === 'Active' ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit account"
                            className="p-2 text-gray-400 hover:text-[#0E8F79] dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(user.id)}
                            title={user.status === 'Active' ? 'Block account' : 'Activate account'}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === 'Active'
                                ? 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-red-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {user.status === 'Active' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>
      </Card>

      {/* Add / Edit modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingUser ? 'Edit Account' : 'Add New Account'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingUser
                    ? `Editing: ${displayName(editingUser)}`
                    : 'Create a new Supervisor, Sales, or Technical account'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={MAX_NAME}
                    value={formData.lastName}
                    onChange={(e) => { setFormData((p) => ({ ...p, lastName: e.target.value })); setFieldErrors((p) => ({ ...p, lastName: '' })); }}
                    placeholder="e.g. Santos"
                    className={`w-full px-4 py-2.5 border ${fieldErrors.lastName ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                  />
                  {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={MAX_NAME}
                    value={formData.firstName}
                    onChange={(e) => { setFormData((p) => ({ ...p, firstName: e.target.value })); setFieldErrors((p) => ({ ...p, firstName: '' })); }}
                    placeholder="e.g. Maria"
                    className={`w-full px-4 py-2.5 border ${fieldErrors.firstName ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                  />
                  {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Middle Name{' '}
                  <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={MAX_NAME}
                  value={formData.middleName}
                  onChange={(e) => { setFormData((p) => ({ ...p, middleName: e.target.value })); setFieldErrors((p) => ({ ...p, middleName: '' })); }}
                  placeholder="e.g. Reyes"
                  className={`w-full px-4 py-2.5 border ${fieldErrors.middleName ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                />
                {fieldErrors.middleName && <p className="text-red-500 text-xs mt-1">{fieldErrors.middleName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={MAX_EMAIL}
                  value={formData.email}
                  onChange={(e) => { setFormData((p) => ({ ...p, email: e.target.value })); setFieldErrors((p) => ({ ...p, email: '' })); }}
                  placeholder="user@maptech.com"
                  className={`w-full px-4 py-2.5 border ${fieldErrors.email ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={MAX_PHONE}
                  value={formData.contactNumber}
                  onChange={(e) => { setFormData((p) => ({ ...p, contactNumber: e.target.value })); setFieldErrors((p) => ({ ...p, contactNumber: '' })); }}
                  placeholder="e.g. +63 912 345 6789"
                  className={`w-full px-4 py-2.5 border ${fieldErrors.contactNumber ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                />
                {fieldErrors.contactNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.contactNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, role: e.target.value as 'admin' | 'employee' | 'sales' }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none"
                >
                  <option value="admin">Supervisor</option>
                  <option value="sales">Sales</option>
                  <option value="employee">Technical Staff</option>
                </select>
              </div>

              {editingUser && isSuperadmin && (
                <>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Password Change Section
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Fill these fields only if you want to update the account password.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      New Password
                      <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                    </label>
                     <div className="relative">
                     <input
                       type={showNewPassword ? "text" : "password"}
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((p) => ({ ...p, newPassword: '' })); }}
                      placeholder="Leave blank to keep current password"
                      className={`w-full px-4 py-2.5 border ${fieldErrors.newPassword ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                    />
                     <button
                       type="button"
                       onClick={() => setShowNewPassword(!showNewPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                       title={showNewPassword ? "Hide password" : "Show password"}
                     >
                       {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                     </div>
                    {fieldErrors.newPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm New Password
                      <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                    </label>
                     <div className="relative">
                     <input
                       type={showConfirmPassword ? "text" : "password"}
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
                      placeholder="Repeat new password"
                      className={`w-full px-4 py-2.5 border ${fieldErrors.confirmPassword ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none`}
                    />
                     <button
                       type="button"
                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                       title={showConfirmPassword ? "Hide password" : "Show password"}
                     >
                       {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                     </div>
                    {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">

                  Cancel
                </button>
                <GreenButton type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingUser ? 'Saving...' : 'Creating...'}
                    </span>
                  ) : (
                    editingUser ? 'Save Changes' : 'Create Account'
                  )}
                </GreenButton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Recovery Key modal — shown after creating a new user */}
      {recoveryKeyModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Key className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recovery Key</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{recoveryKeyModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setRecoveryKeyModal(null); loadUsers(); }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Important: Save this recovery key!</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">This key is required to reset the password. Please provide it to the user and store it securely. It will not be shown again.</p>
              </div>
              <div className="relative">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100 text-center tracking-wider select-all break-all">
                  {recoveryKeyModal.key}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryKeyModal.key);
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 2000);
                    toast.success('Recovery key copied to clipboard.');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Copy to clipboard"
                >
                  {keyCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => { setRecoveryKeyModal(null); loadUsers(); }}
                className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/20 transition-all text-sm"
              >
                I've Saved the Key
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
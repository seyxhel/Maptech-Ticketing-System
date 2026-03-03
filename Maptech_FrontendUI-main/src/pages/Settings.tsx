import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { User, Lock, Mail, Phone, Building, Shield, Pencil, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword, updateProfile } from '../services/authService';
import { toast } from 'sonner';
import {
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhone,
  MAX_PASSWORD,
  MAX_NAME,
  MAX_PHONE,
  type PasswordRules,
} from '../utils/validation';

export function Settings() {
  const { user, updateUser } = useAuth();

  /* ── Profile editing state ── */
  const [editing, setEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    middle_name: user?.middle_name || '',
    last_name: user?.last_name || '',
    suffix: user?.suffix || '',
    phone: user?.phone || '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const startEdit = () => {
    setForm({
      first_name: user?.first_name || '',
      middle_name: user?.middle_name || '',
      last_name: user?.last_name || '',
      suffix: user?.suffix || '',
      phone: user?.phone || '',
    });
    setFieldErrors({});
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setFieldErrors({}); };

  const handleField = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setFieldErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSaveProfile = async () => {
    const errs: Record<string, string> = {};
    const fnErr = validateName(form.first_name, 'First name');
    if (fnErr) errs.first_name = fnErr;
    const lnErr = validateName(form.last_name, 'Last name');
    if (lnErr) errs.last_name = lnErr;
    if (form.phone) {
      const phErr = validatePhone(form.phone);
      if (phErr) errs.phone = phErr;
    }
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setProfileLoading(true);
    try {
      const updated = await updateProfile(form);
      updateUser({
        first_name: updated.first_name,
        middle_name: updated.middle_name,
        last_name: updated.last_name,
        suffix: updated.suffix,
        phone: updated.phone,
      });
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwRules, setPwRules] = useState<PasswordRules | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (!currentPassword || !newPassword || !confirmPw) {
      setPwError('All fields are required.');
      return;
    }
    const { error } = validatePassword(newPassword);
    if (error) { setPwError(error); return; }
    const confirmErr = validateConfirmPassword(newPassword, confirmPw);
    if (confirmErr) { setPwError(confirmErr); return; }

    setPwLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPw('');
      setPwRules(null);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Helpers ── */
  const inputClass = 'w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400';
  const boxEdit = 'flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]';
  const boxReadonly = 'flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your super admin account settings</p>
      </div>

      {/* ── Personal Details ── */}
      <Card accent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Details</h2>
          {!editing ? (
            <button onClick={startEdit} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3BC25B] hover:text-[#63D44A] transition-colors">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>

        {!editing ? (
          /* Read-only view */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'First Name', value: user?.first_name || '—', icon: User },
              { label: 'Last Name', value: user?.last_name || '—', icon: User },
              { label: 'Middle Name', value: user?.middle_name || '—', icon: User },
              { label: 'Suffix', value: user?.suffix || '—', icon: User },
              { label: 'Email', value: user?.email || '—', icon: Mail },
              { label: 'Phone', value: user?.phone || '—', icon: Phone },
              { label: 'Department', value: 'Administration', icon: Building },
              { label: 'Role', value: 'Super Administrator', icon: Shield },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{f.label}</label>
                <div className={boxReadonly}>
                  <f.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{f.value}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Edit form */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">First Name <span className="text-red-400">*</span></label>
                <div className={boxEdit}>
                  <User className="w-4 h-4 text-gray-400" />
                  <input value={form.first_name} maxLength={MAX_NAME} onChange={(e) => handleField('first_name', e.target.value)} className={inputClass} placeholder="First name" />
                </div>
                {fieldErrors.first_name && <p className="text-xs text-red-400 mt-1">{fieldErrors.first_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Last Name <span className="text-red-400">*</span></label>
                <div className={boxEdit}>
                  <User className="w-4 h-4 text-gray-400" />
                  <input value={form.last_name} maxLength={MAX_NAME} onChange={(e) => handleField('last_name', e.target.value)} className={inputClass} placeholder="Last name" />
                </div>
                {fieldErrors.last_name && <p className="text-xs text-red-400 mt-1">{fieldErrors.last_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Middle Name</label>
                <div className={boxEdit}>
                  <User className="w-4 h-4 text-gray-400" />
                  <input value={form.middle_name} maxLength={MAX_NAME} onChange={(e) => handleField('middle_name', e.target.value)} className={inputClass} placeholder="Middle name (optional)" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Suffix</label>
                <div className={boxEdit}>
                  <User className="w-4 h-4 text-gray-400" />
                  <input value={form.suffix} maxLength={10} onChange={(e) => handleField('suffix', e.target.value)} className={inputClass} placeholder="e.g. Jr., Sr., III" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone</label>
                <div className={boxEdit}>
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input value={form.phone} maxLength={MAX_PHONE} onChange={(e) => handleField('phone', e.target.value)} className={inputClass} placeholder="+63 9XX XXX XXXX" />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</label>
                <div className={boxReadonly}>
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email || '—'}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Role</label>
                <div className={boxReadonly}>
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Super Administrator</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <GreenButton type="button" onClick={handleSaveProfile} disabled={profileLoading}>
                {profileLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
              </GreenButton>
              <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card accent>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {pwError && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{pwError}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input type="password" value={currentPassword} maxLength={MAX_PASSWORD} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">New Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input type="password" value={newPassword} maxLength={MAX_PASSWORD} onChange={(e) => { setNewPassword(e.target.value); const { rules } = validatePassword(e.target.value); setPwRules(rules); }} placeholder="••••••••" className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
            {newPassword && pwRules && (
              <ul className="text-xs space-y-0.5 mt-1.5">
                {[
                  { ok: pwRules.minLength, text: 'At least 8 characters' },
                  { ok: pwRules.hasUppercase, text: 'An uppercase letter' },
                  { ok: pwRules.hasLowercase, text: 'A lowercase letter' },
                  { ok: pwRules.hasNumber, text: 'A number' },
                  { ok: pwRules.hasSpecial, text: 'A special character' },
                ].map((r) => (
                  <li key={r.text} className={r.ok ? 'text-green-600' : 'text-gray-400'}>{r.ok ? '\u2713' : '\u2022'} {r.text}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input type="password" value={confirmPw} maxLength={MAX_PASSWORD} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
          </div>
          <GreenButton type="submit" disabled={pwLoading}>
            {pwLoading ? 'Updating…' : 'Update Password'}
          </GreenButton>
        </form>
      </Card>
    </div>
  );
}

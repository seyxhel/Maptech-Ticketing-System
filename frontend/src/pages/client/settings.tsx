import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import { User, Lock, Mail, Phone, Building, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { changePassword } from '../../services/authService';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateAddress,
  validateRequired,
  validatePassword,
  validateConfirmPassword,
  checkPasswordPwned,
  MAX_NAME,
  MAX_EMAIL,
  MAX_PHONE,
  MAX_ADDRESS,
  MAX_FIELD,
  MAX_PASSWORD,
  type PasswordRules,
} from '../../utils/validation';

const inputCls =
  'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm';
const labelCls =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5';

export default function ClientSettingsPage() {
  // Personal details state
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Client');
  const [email, setEmail] = useState('john@client.com');
  const [phone, setPhone] = useState('09171234567');
  const [company, setCompany] = useState('Maptech Inc.');
  const [address, setAddress] = useState('123 Main Street, Quezon City');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation state
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [pwError, setPwError] = useState('');
  const [pwRules, setPwRules] = useState<PasswordRules | null>(null);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const fnErr = validateName(firstName, 'First Name');
    if (fnErr) errs.firstName = fnErr;
    const lnErr = validateName(lastName, 'Last Name');
    if (lnErr) errs.lastName = lnErr;
    const emErr = validateEmail(email);
    if (emErr) errs.email = emErr;
    const phErr = validatePhone(phone, 'Phone Number');
    if (phErr) errs.phone = phErr;
    const coErr = validateRequired(company, 'Company');
    if (coErr) errs.company = coErr;
    const adErr = validateAddress(address);
    if (adErr) errs.address = adErr;
    setDetailErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted errors.');
      return;
    }
    // TODO: API call
    toast.success('Personal details saved successfully.');
  };

  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    const { error } = validatePassword(newPassword);
    if (error) { setPwError(error); return; }
    const confirmErr = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmErr) { setPwError(confirmErr); return; }
    setPwLoading(true);
    try {
      const breached = await checkPasswordPwned(newPassword);
      if (breached) {
        setPwError('This password has been found in a data breach. Please choose a different password.');
        setPwRules((prev) => prev ? { ...prev, notBreached: false } : prev);
        return;
      }
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwRules(null);
    } catch (err: any) {
      setPwError(err?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account details and security</p>
      </div>

      {/* Personal Details */}
      <Card className="border-l-4 border-l-[#3BC25B]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-[#0E8F79]/10 dark:bg-[#0E8F79]/20">
            <User className="w-5 h-5 text-[#0E8F79]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Details</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Update your personal information</p>
          </div>
        </div>

        <form onSubmit={handleSaveDetails} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  maxLength={MAX_NAME}
                  onChange={(e) => { setFirstName(e.target.value); setDetailErrors((p) => ({ ...p, firstName: '' })); }}
                  placeholder="e.g. John"
                  className={inputCls + ' pl-10'}
                />
              </div>
              {detailErrors.firstName && <p className="text-red-500 text-xs mt-1">{detailErrors.firstName}</p>}
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={lastName}
                  maxLength={MAX_NAME}
                  onChange={(e) => { setLastName(e.target.value); setDetailErrors((p) => ({ ...p, lastName: '' })); }}
                  placeholder="e.g. Doe"
                  className={inputCls + ' pl-10'}
                />
              </div>
              {detailErrors.lastName && <p className="text-red-500 text-xs mt-1">{detailErrors.lastName}</p>}
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  maxLength={MAX_EMAIL}
                  onChange={(e) => { setEmail(e.target.value); setDetailErrors((p) => ({ ...p, email: '' })); }}
                  placeholder="e.g. john@example.com"
                  className={inputCls + ' pl-10'}
                />
              </div>
              {detailErrors.email && <p className="text-red-500 text-xs mt-1">{detailErrors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  maxLength={MAX_PHONE}
                  onChange={(e) => { setPhone(e.target.value); setDetailErrors((p) => ({ ...p, phone: '' })); }}
                  placeholder="e.g. 09171234567"
                  className={inputCls + ' pl-10'}
                />
              </div>
              {detailErrors.phone && <p className="text-red-500 text-xs mt-1">{detailErrors.phone}</p>}
            </div>
            <div>
              <label className={labelCls}>Company / Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={company}
                  maxLength={MAX_FIELD}
                  onChange={(e) => { setCompany(e.target.value); setDetailErrors((p) => ({ ...p, company: '' })); }}
                  placeholder="e.g. Maptech Inc."
                  className={inputCls + ' pl-10'}
                />
              </div>
              {detailErrors.company && <p className="text-red-500 text-xs mt-1">{detailErrors.company}</p>}
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  maxLength={MAX_ADDRESS}
                  onChange={(e) => { setAddress(e.target.value); setDetailErrors((p) => ({ ...p, address: '' })); }}
                  placeholder="e.g. 123 Main Street, Quezon City"
                  className={inputCls + ' pl-10'}
                />
              </div>
              {detailErrors.address && <p className="text-red-500 text-xs mt-1">{detailErrors.address}</p>}
            </div>
          </div>
          <div className="pt-2">
            <GreenButton type="submit">Save Changes</GreenButton>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="border-l-4 border-l-[#3BC25B]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-[#0E8F79]/10 dark:bg-[#0E8F79]/20">
            <Lock className="w-5 h-5 text-[#0E8F79]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="max-w-md space-y-4">
            {pwError && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{pwError}</div>}
            <div>
              <label className={labelCls}>Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  maxLength={MAX_PASSWORD}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  maxLength={MAX_PASSWORD}
                  onChange={(e) => { setNewPassword(e.target.value); const { rules } = validatePassword(e.target.value); setPwRules(rules); }}
                  placeholder="Enter new password"
                  className={inputCls + ' pl-10'}
                />
              </div>
              {/* Password strength rules */}
              {newPassword && pwRules && (
                <ul className="text-xs space-y-0.5 mt-1">
                  {[
                    { ok: pwRules.minLength, text: 'At least 8 characters' },
                    { ok: pwRules.hasUppercase, text: 'An uppercase letter' },
                    { ok: pwRules.hasLowercase, text: 'A lowercase letter' },
                    { ok: pwRules.hasNumber, text: 'A number' },
                    { ok: pwRules.hasSpecial, text: 'A special character' },
                  ].map((r) => (
                    <li key={r.text} className={r.ok ? 'text-green-600' : 'text-red-500'}>
                      {r.ok ? '\u2713' : '\u2717'} {r.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  maxLength={MAX_PASSWORD}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
          </div>
          <div className="pt-2">
            <GreenButton type="submit">Update Password</GreenButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

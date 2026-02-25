import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import { User, Lock, Mail, Phone, Building, MapPin } from 'lucide-react';

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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    alert('Personal details saved successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    // TODO: API call
    alert('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Doe"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 09171234567"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Company / Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Maptech Inc."
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Main Street, Quezon City"
                  className={inputCls + ' pl-10'}
                />
              </div>
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
            <div>
              <label className={labelCls}>Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
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
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={inputCls + ' pl-10'}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
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

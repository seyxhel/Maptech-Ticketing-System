import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import { User, Lock, Mail, Phone, Building, MapPin } from 'lucide-react';

export default function EmployeeSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    // TODO: API call
    setPwSuccess('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings</p>
      </div>

      {/* Personal Details */}
      <Card accent>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'First Name', value: 'Sarah', icon: User },
            { label: 'Last Name', value: 'Johnson', icon: User },
            { label: 'Email', value: 'employee@test.com', icon: Mail },
            { label: 'Phone', value: '+63 917 123 4567', icon: Phone },
            { label: 'Department', value: 'Technical Support', icon: Building },
            { label: 'Location', value: 'Manila, Philippines', icon: MapPin },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {field.label}
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <field.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{field.value}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Change Password */}
      <Card accent>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {pwError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">
              {pwSuccess}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">New Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#3BC25B]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
          </div>
          <GreenButton type="submit">Update Password</GreenButton>
        </form>
      </Card>
    </div>
  );
}

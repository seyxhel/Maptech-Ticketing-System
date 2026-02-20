import React from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">System and account settings</p>
      </div>
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <SettingsIcon className="w-8 h-8 text-[#0E8F79] dark:text-green-400" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">General</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure global options</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Use system / app toggle</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Enabled</span>
          </div>
        </div>
        <div className="mt-6">
          <GreenButton variant="outline">Save changes</GreenButton>
        </div>
      </Card>
    </div>
  );
}

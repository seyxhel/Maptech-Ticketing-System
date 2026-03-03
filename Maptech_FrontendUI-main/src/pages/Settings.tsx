import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export function Settings() {
  const { isDark, toggleDark } = useTheme();
  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      aria-checked={on}
      role="switch"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${on ? 'bg-[#3BC25B]' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">System and account settings</p>
      </div>
      <Card accent>
        <div className="flex items-center gap-4 mb-6">
          <SettingsIcon className="w-8 h-8 text-[#0E8F79] dark:text-green-400" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Display & Appearance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure visual preferences</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                <p className="text-xs text-gray-400 dark:text-gray-500">{isDark ? 'Dark theme is active' : 'Light theme is active'}</p>
              </div>
            </div>
            <Toggle on={isDark} onToggle={toggleDark} />
          </div>

        </div>

      </Card>
    </div>
  );
}

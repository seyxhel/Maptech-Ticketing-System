import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import type { NavItem } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';
  currentPage: string;
  onNavigate: (page: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  navItems?: NavItem[];
}
export function Layout({
  children,
  role,
  currentPage,
  onNavigate,
  isDark,
  onToggleDark,
  navItems,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 transition-colors duration-200">
      {/* Mobile overlay */}
      {isSidebarOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={() => setIsSidebarOpen(false)} />

      }

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:block transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <Sidebar
          role={role}
          onNavigate={onNavigate}
          currentPage={currentPage}
          navItems={navItems}
        />

      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNav
          role={role}
          isDark={isDark}
          onToggleDark={onToggleDark}
          onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-6 mt-16 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>);

}
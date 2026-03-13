import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useAuth } from '../../context/AuthContext';
import type { NavItem } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  role: 'SuperAdmin' | 'Admin' | 'Employee' | 'Technical' | 'Technical Staff' | 'Client';
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentPage]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

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
          onExpandChange={setIsSidebarExpanded}
          isMobileOpen={isSidebarOpen}
          onNavigateItem={() => setIsSidebarOpen(false)}
        />

      </div>

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarExpanded ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <TopNav
          role={role}
          isDark={isDark}
          onToggleDark={onToggleDark}
          onMenuClick={() => setIsSidebarOpen(true)}
          onNavigate={onNavigate}
          user={authUser}
          isSidebarExpanded={isSidebarExpanded} />

        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 mt-16 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 w-full">{children}</div>
        </main>
      </div>
    </div>);

}
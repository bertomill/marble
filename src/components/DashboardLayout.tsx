'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Function to handle sidebar state changes
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex bg-[#121016] min-h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar onToggle={handleSidebarToggle} />
      
      {/* Main Content Area - adjusts based on sidebar state with a smooth transition */}
      <main 
        className="flex-grow transition-all duration-300 ease-in-out overflow-x-hidden"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }} 
      >
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
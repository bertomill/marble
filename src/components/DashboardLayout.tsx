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
    <div className="flex bg-[#121016] min-h-screen">
      {/* Sidebar */}
      <Sidebar onToggle={handleSidebarToggle} />
      
      {/* Main Content Area - adjusts based on sidebar state with a smooth transition */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out w-full`}
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }} 
      >
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
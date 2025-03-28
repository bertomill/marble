'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="w-full h-full overflow-x-hidden">
        {children}
      </div>
    </DashboardLayout>
  );
}
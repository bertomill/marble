'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

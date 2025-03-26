'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 
'use client';

import DashboardLayout from '@/components/DashboardLayout';

interface GeneratorLayoutProps {
  children: React.ReactNode;
}

export default function GeneratorLayout({ children }: GeneratorLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

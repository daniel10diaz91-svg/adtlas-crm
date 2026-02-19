'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useLanguage } from '@/components/LanguageProvider';

export function DashboardShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t('common.closeMenu')}
          className="fixed inset-0 z-20 bg-zinc-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="pl-0 lg:pl-[240px]">
        <TopBar displayName={displayName} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

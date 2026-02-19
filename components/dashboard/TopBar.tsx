'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pathTitles: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/leads': 'Leads',
  '/dashboard/pipeline': 'Pipeline',
  '/dashboard/tareas': 'Tasks',
  '/dashboard/integraciones': 'Integrations',
};

type TopBarProps = {
  displayName: string;
};

export function TopBar({ displayName }: TopBarProps) {
  const pathname = usePathname();
  const title = pathTitles[pathname] ?? pathname.split('/').filter(Boolean).pop() ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-700">{displayName}</span>
        <Link
          href="/api/auth/signout"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}

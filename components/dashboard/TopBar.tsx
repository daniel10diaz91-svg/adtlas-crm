'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { TranslationKey } from '@/lib/i18n';

const pathKeys: Record<string, TranslationKey> = {
  '/dashboard': 'nav.home',
  '/dashboard/leads': 'nav.leads',
  '/dashboard/pipeline': 'nav.pipeline',
  '/dashboard/tareas': 'nav.tasks',
  '/dashboard/integraciones': 'nav.integrations',
  '/dashboard/admin/usuarios': 'admin.users',
};

type TopBarProps = {
  displayName: string;
  onMenuClick?: () => void;
};

export function TopBar({ displayName, onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const key = pathKeys[pathname] ?? pathKeys[pathname.split('/').slice(0, -1).join('/')];
  const title = key ? t(key) : pathname.split('/').filter(Boolean).pop() ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            aria-label={t('common.openMenu')}
            className="rounded p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
            onClick={onMenuClick}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <span className="text-sm font-medium text-zinc-700">{displayName}</span>
        <Link
          href="/api/auth/signout"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          {t('topbar.signOut')}
        </Link>
      </div>
    </header>
  );
}

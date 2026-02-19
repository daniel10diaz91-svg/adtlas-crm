'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/components/LanguageProvider';
import type { Locale } from '@/lib/i18n';

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  return (
    <SessionProvider>
      <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
    </SessionProvider>
  );
}

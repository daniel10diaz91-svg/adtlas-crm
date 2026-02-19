'use client';

import { useLanguage } from '@/components/LanguageProvider';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
      {(['es', 'en'] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
            locale === l ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {l === 'es' ? 'ES' : 'EN'}
        </button>
      ))}
    </div>
  );
}

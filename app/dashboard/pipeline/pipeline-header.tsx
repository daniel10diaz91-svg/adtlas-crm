'use client';

import { useLanguage } from '@/components/LanguageProvider';

export function PipelineHeader() {
  const { t } = useLanguage();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">{t('pipeline.title')}</h1>
      <p className="mt-1 text-zinc-600">
        {t('pipeline.dragHint')}
      </p>
    </div>
  );
}

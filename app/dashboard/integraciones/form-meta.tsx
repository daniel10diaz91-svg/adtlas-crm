'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

export function FormMeta() {
  const router = useRouter();
  const { t } = useLanguage();
  const [pageId, setPageId] = useState('');
  const [formId, setFormId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!pageId.trim() || !formId.trim()) {
      setError(t('integrations.pageIdFormIdRequired'));
      return;
    }
    setLoading(true);
    const res = await fetch('/api/lead-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'meta',
        external_id: `${pageId.trim()}_${formId.trim()}`,
        name: name.trim() || undefined,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t('integrations.errorSaving'));
      return;
    }
    setPageId('');
    setFormId('');
    setName('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-600">{t('integrations.metaPageId')} (Meta)</label>
        <input
          type="text"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          placeholder={t('integrations.placeholderPage')}
          className="input-field w-40 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">{t('integrations.metaFormId')} (Meta)</label>
        <input
          type="text"
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
          placeholder={t('integrations.placeholderForm')}
          className="input-field w-40 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">{t('integrations.metaSourceName')} (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('integrations.placeholderName')}
          className="input-field w-40 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? t('common.saving') : t('integrations.add')}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

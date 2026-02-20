'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

type Workspace = { id: string; phone_number_id: string; created_at: string };

export function FormWhatsApp() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState<Workspace[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchList() {
    const res = await fetch('/api/whatsapp-workspaces');
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!phoneNumberId.trim()) {
      setError(t('integrations.phoneNumberIdRequired'));
      return;
    }
    setLoading(true);
    const res = await fetch('/api/whatsapp-workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number_id: phoneNumberId.trim() }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t('integrations.errorSaving'));
      return;
    }
    setPhoneNumberId('');
    fetchList();
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/whatsapp-workspaces/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      fetchList();
      router.refresh();
    }
  }

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600">{t('integrations.phoneNumberId')}</label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder={t('integrations.placeholderPhoneNumberId')}
            className="input-field w-56 text-sm font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? t('common.saving') : t('integrations.add')}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {list.length > 0 ? (
        <div className="mt-6 border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-medium text-zinc-700">{t('integrations.connectedNumbers')}</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {list.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 rounded bg-zinc-50 px-3 py-2">
                <span className="font-mono text-zinc-800">{w.phone_number_id}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(w.id)}
                  disabled={deletingId === w.id}
                  className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

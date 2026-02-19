'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const leadId = searchParams.get('leadId') ?? '';
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError(t('tasks.titleRequired'));
      return;
    }
    setLoading(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        due_at: dueDate || null,
        lead_id: leadId || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t('tasks.errorCreatingTask'));
      return;
    }
    if (leadId) router.push(`/dashboard/leads/${leadId}`);
    else router.push('/dashboard/tareas');
    router.refresh();
  }

  return (
    <div className="max-w-md space-y-6">
      <p className="text-zinc-600">{leadId ? t('tasks.addTaskToLead') : t('tasks.addTaskOrReminder')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">{t('tasks.titleLabel')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder={t('tasks.placeholder')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">{t('tasks.dueDate')} (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-field"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? t('common.saving') : t('common.save')}
          </button>
          <Link
            href="/dashboard/tareas"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}

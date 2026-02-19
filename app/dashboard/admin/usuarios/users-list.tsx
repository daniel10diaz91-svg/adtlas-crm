'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

type User = { id: string; name: string | null; email: string; role: string };

const ROLE_KEYS = {
  admin: 'admin.roleAdmin',
  manager: 'admin.roleManager',
  sales: 'admin.roleSales',
  support: 'admin.roleSupport',
  readonly: 'admin.roleReadonly',
} as const;

export function UsersList({ users }: { users: User[] }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;
    if (!email || !password) {
      setError(t('admin.emailPasswordRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined, role: role || 'sales' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('admin.errorCreatingUser'));
        return;
      }
      setShowForm(false);
      form.reset();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditName(u.name ?? '');
    setEditRole(u.role);
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName || undefined, role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al actualizar');
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? t('common.cancel') : t('admin.newUser')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-zinc-900">{t('admin.createUserTitle')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{t('auth.email')}</label>
              <input name="email" type="email" required className="input-field text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{t('admin.password')}</label>
              <input name="password" type="password" required className="input-field text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{t('auth.name')}</label>
              <input name="name" type="text" className="input-field text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{t('admin.role')}</label>
              <select name="role" className="input-field text-sm" defaultValue="sales">
                {(['manager', 'sales', 'support', 'readonly'] as const).map((value) => (
                  <option key={value} value={value}>{t(ROLE_KEYS[value])}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={loading} className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('admin.create')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t('leads.name')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t('auth.email')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t('admin.role')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {users.map((u) => (
              <tr key={u.id} className="bg-white">
                {editingId === u.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field w-full py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-500">{u.email}</td>
                    <td className="px-4 py-2">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="input-field rounded py-1.5 text-sm"
                      >
                      {(['admin', 'manager', 'sales', 'support', 'readonly'] as const).map((value) => (
                        <option key={value} value={value}>{t(ROLE_KEYS[value])}</option>
                      ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleUpdate(u.id)}
                        disabled={loading}
                        className="text-indigo-600 hover:underline disabled:opacity-50"
                      >
                        {t('common.save')}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="ml-2 text-zinc-500 hover:underline">
                        {t('common.cancel')}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-zinc-900">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {(u.role in ROLE_KEYS ? t(ROLE_KEYS[u.role as keyof typeof ROLE_KEYS]) : u.role)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => startEdit(u)} className="text-indigo-600 hover:underline text-sm">
                        {t('common.edit')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

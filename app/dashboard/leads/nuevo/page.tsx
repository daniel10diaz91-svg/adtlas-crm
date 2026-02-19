'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TenantUser = { id: string; name: string | null; email: string };

export default function NuevoLeadPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setTenantUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const body: { name?: string; email?: string; phone?: string; assigned_to_user_id?: string | null } = {
      name,
      email,
      phone,
    };
    if (tenantUsers.length > 0) {
      body.assigned_to_user_id = assignedTo || null;
    }
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Error creating lead');
      return;
    }
    router.push('/dashboard/leads');
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">New lead</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        {tenantUsers.length > 0 && (
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Assign to (optional)</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              <option value="">Unassigned</option>
              {tenantUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string;
  origin: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

const originColors: Record<string, string> = {
  meta: 'bg-blue-100 text-blue-800',
  google: 'bg-emerald-100 text-emerald-800',
  manual: 'bg-zinc-100 text-zinc-600',
};

export function LeadsList({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [originFilter, setOriginFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(leadId: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    setDeletingId(leadId);
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) router.refresh();
    else alert('Could not delete lead.');
  }

  const filtered = originFilter
    ? leads.filter((l) => l.origin === originFilter)
    : leads;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['', 'meta', 'google', 'manual'].map((origin) => (
          <button
            key={origin || 'all'}
            type="button"
            onClick={() => setOriginFilter(origin)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              originFilter === origin
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {origin === '' ? 'All' : origin.charAt(0).toUpperCase() + origin.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80">
              <tr>
                <th className="px-5 py-3 font-medium text-zinc-600">Name</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Email</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Phone</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Origin</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Date</th>
                <th className="w-10 px-5 py-3 font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                      <div className="rounded-full bg-zinc-100 p-4">
                        <svg
                          className="h-8 w-8 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <p className="mt-4 font-medium text-zinc-900">No leads yet</p>
                      <p className="mt-1 max-w-sm text-sm text-zinc-500">
                        Add your first lead manually or connect Meta/Google in Integrations.
                      </p>
                      <div className="mt-6 flex gap-3">
                        <Link
                          href="/dashboard/leads/nuevo"
                          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Add your first lead
                        </Link>
                        <Link
                          href="/dashboard/integraciones"
                          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Integrations
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50"
                  >
                    <td className="px-5 py-3 font-medium text-zinc-900">{lead.name || '—'}</td>
                    <td className="px-5 py-3 text-zinc-600">{lead.email || '—'}</td>
                    <td className="px-5 py-3 text-zinc-600">{lead.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          originColors[lead.origin] ?? 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {lead.origin}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingId === lead.id}
                        className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Delete lead"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getSlaStatusFromLead,
  slaColorsLight,
  slaShortLabels,
  slaTooltips,
  slaTooltipMessageRed,
  type LastMessageForSla,
} from '@/lib/sla';
import { useLanguage } from '@/components/LanguageProvider';

type Lead = {
  id: string;
  origin: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  assigned_to_user_id: string | null;
};

type TenantUser = { id: string; name: string | null; email: string };

const originColors: Record<string, string> = {
  meta: 'bg-blue-100 text-blue-800',
  google: 'bg-emerald-100 text-emerald-800',
  manual: 'bg-zinc-100 text-zinc-600',
};

type ViewType = 'mine' | 'team' | 'all';

export function LeadsList({
  leads,
  canAssignAndDelete,
  tenantUsers,
  currentView = 'all',
  role,
  lastMessageByLeadId = {},
}: {
  leads: Lead[];
  canAssignAndDelete: boolean;
  tenantUsers: TenantUser[];
  currentView?: string;
  role?: string;
  lastMessageByLeadId?: Record<string, LastMessageForSla>;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [originFilter, setOriginFilter] = useState<string>('');
  const showViewSelector = role === 'admin' || role === 'manager';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function handleAssign(leadId: string, userId: string | null) {
    setAssigningId(leadId);
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to_user_id: userId || null }),
    });
    setAssigningId(null);
    if (res.ok) router.refresh();
  }

  async function handleDelete(leadId: string) {
    if (!confirm(t('leads.deleteConfirm'))) return;
    setDeletingId(leadId);
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) router.refresh();
    else alert(t('leads.deleteError'));
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

  const setView = (v: ViewType) => {
    router.push(`/dashboard/leads?view=${v}`);
  };

  return (
    <div className="space-y-4">
      {showViewSelector && (
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {(['mine', 'team', 'all'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                currentView === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {v === 'mine' ? t('leads.viewMine') : v === 'team' ? t('leads.viewTeam') : t('leads.viewAll')}
            </button>
          ))}
        </div>
      )}
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
                <th className="w-20 px-3 py-3 font-medium text-zinc-600" title={t('leads.tableTimeTitle')}>{t('leads.tableTime')}</th>
                <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableName')}</th>
                <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableEmail')}</th>
                <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tablePhone')}</th>
                <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.origin')}</th>
                {canAssignAndDelete && <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.assignedTo')}</th>}
                <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableDate')}</th>
                <th className="w-10 px-5 py-3 font-medium text-zinc-600">{t('leads.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canAssignAndDelete ? 8 : 7}>
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
                      <p className="mt-4 font-medium text-zinc-900">{t('leads.noLeadsYet')}</p>
                      <p className="mt-1 max-w-sm text-sm text-zinc-500">
                        {t('leads.noLeadsHint')}
                      </p>
                      <div className="mt-6 flex gap-3">
                        <Link
                          href="/dashboard/leads/nuevo"
                          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          {t('leads.addFirstLead')}
                        </Link>
                        <Link
                          href="/dashboard/integraciones"
                          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {t('leads.integrationsLink')}
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const lastMsg = lastMessageByLeadId[lead.id];
                  const sla = getSlaStatusFromLead(lead, lastMsg);
                  const isRedFromMessage =
                    sla === 'red' &&
                    lastMsg &&
                    lastMsg.type === 'inbound' &&
                    !lastMsg.is_read;
                  const slaTitle = isRedFromMessage
                    ? slaTooltipMessageRed
                    : slaTooltips[sla];
                  return (
                  <tr
                    key={lead.id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50"
                  >
                    <td className="px-3 py-3" title={slaTitle}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${slaColorsLight[sla]}`}>
                        {slaShortLabels[sla]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-900">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-indigo-600 hover:underline">
                        {lead.name || '—'}
                      </Link>
                    </td>
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
                    {canAssignAndDelete && (
                      <td className="px-5 py-3">
                        <select
                          value={lead.assigned_to_user_id ?? ''}
                          onChange={(e) => handleAssign(lead.id, e.target.value || null)}
                          disabled={assigningId === lead.id}
                          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                        >
                          <option value="">{t('common.unassigned')}</option>
                          {tenantUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name || u.email}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-5 py-3 text-zinc-500">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingId === lead.id}
                        className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title={t('common.delete')}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

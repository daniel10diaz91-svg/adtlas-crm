'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  origin: string;
  created_at: string;
};

const originColors: Record<string, string> = {
  meta: 'bg-blue-100 text-blue-800',
  google: 'bg-emerald-100 text-emerald-800',
  manual: 'bg-zinc-100 text-zinc-600',
};

export function RecentLeadsTable({ leads }: { leads: Lead[] }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">{t('dashboard.recentLeads')}</h3>
        <Link
          href="/dashboard/leads"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {t('common.viewAll')}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50">
            <tr>
              <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableName')}</th>
              <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableEmail')}</th>
              <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableSource')}</th>
              <th className="px-5 py-3 font-medium text-zinc-600">{t('leads.tableDate')}</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                  {t('leads.noLeadsYet')}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="px-5 py-3 font-medium text-zinc-900">{lead.name || '—'}</td>
                  <td className="px-5 py-3 text-zinc-600">{lead.email || '—'}</td>
                  <td className="px-5 py-3">
                    <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      originColors[lead.origin] ?? 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {lead.origin}
                  </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { RecentLeadsTable } from '@/components/dashboard/RecentLeadsTable';

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;

  const supabase = createServiceClient();
  const tenantId = session.user.tenantId;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [{ count: totalLeads }, { count: newThisWeek }, { data: stages }, { data: allLeadsForPipeline }, { data: recentLeads }, { data: leadsForChart }] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', weekAgo.toISOString()),
    supabase.from('pipeline_stages').select('id, name').eq('tenant_id', tenantId).order('order', { ascending: true }),
    supabase.from('leads').select('id, stage_id').eq('tenant_id', tenantId),
    supabase.from('leads').select('id, name, email, origin, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    supabase.from('leads').select('created_at').eq('tenant_id', tenantId).gte('created_at', twoWeeksAgo.toISOString()),
  ]);

  const closedStageIds = (stages ?? []).slice(-2).map((s) => s.id);
  const inPipeline = (allLeadsForPipeline ?? []).filter((l) => !l.stage_id || !closedStageIds.includes(l.stage_id)).length;

  const chartMap: Record<string, number> = {};
  for (let d = 0; d < 14; d++) {
    const date = new Date(twoWeeksAgo);
    date.setDate(date.getDate() + d);
    chartMap[date.toISOString().slice(0, 10)] = 0;
  }
  (leadsForChart ?? []).forEach((l) => {
    const day = (l.created_at as string).slice(0, 10);
    if (chartMap[day] !== undefined) chartMap[day]++;
  });
  const chartData = Object.entries(chartMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return (
    <div className="space-y-6">
      <p className="text-zinc-600">
        Hi, {session.user?.name ?? session.user?.email}. Here’s your overview.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total leads" value={totalLeads ?? 0} />
        <KpiCard title="New this week" value={newThisWeek ?? 0} />
        <KpiCard title="In pipeline" value={inPipeline} subtitle="Not won/lost" />
      </div>

      <LeadsChart data={chartData} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentLeadsTable leads={recentLeads ?? []} />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Quick actions</h3>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/dashboard/leads/nuevo"
                className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add lead
              </Link>
              <Link
                href="/dashboard/pipeline"
                className="flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Open pipeline
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { LeadsList } from './leads-list';

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;
  const supabase = createServiceClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-600">View and manage all your leads.</p>
        <Link
          href="/dashboard/leads/nuevo"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New lead
        </Link>
      </div>
      <LeadsList leads={leads ?? []} />
    </div>
  );
}

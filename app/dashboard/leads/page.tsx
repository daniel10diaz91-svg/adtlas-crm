import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { LeadsList } from './leads-list';

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) return null;
  const supabase = createServiceClient();
  const role = session.user.role;
  const userId = session.user.id;
  let leadsQ = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (role === 'ventas') {
    leadsQ = leadsQ.eq('assigned_to_user_id', userId);
  }
  const { data: leads } = await leadsQ;

  let tenantUsers: { id: string; name: string | null; email: string }[] = [];
  if (role === 'admin') {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('tenant_id', session.user.tenantId);
    tenantUsers = users ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-600">
          {role === 'ventas' ? 'Leads assigned to you.' : 'View and manage all your leads.'}
        </p>
        <Link
          href="/dashboard/leads/nuevo"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New lead
        </Link>
      </div>
      <LeadsList leads={leads ?? []} isAdmin={role === 'admin'} tenantUsers={tenantUsers} />
    </div>
  );
}

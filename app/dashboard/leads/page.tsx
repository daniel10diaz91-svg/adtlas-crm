import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { LeadsList } from './leads-list';

type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) return null;
  const { view } = await searchParams;
  const supabase = createServiceClient();
  const role = session.user.role;
  const userId = session.user.id;

  let leadsQ = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });

  if (role === 'sales') {
    leadsQ = leadsQ.eq('assigned_to_user_id', userId);
  } else {
    if (view === 'mine') leadsQ = leadsQ.eq('assigned_to_user_id', userId);
    else if (view === 'team' || view === 'all') { /* all tenant */ }
  }
  const { data: leads } = await leadsQ;

  const leadIds = (leads ?? []).map((l) => l.id);
  let lastMessageByLeadId: Record<string, { type: string; is_read: boolean; created_at: string }> = {};
  if (leadIds.length > 0) {
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('lead_id, type, is_read, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false });
    for (const m of lastMsgs ?? []) {
      if (m.lead_id && !(m.lead_id in lastMessageByLeadId)) {
        lastMessageByLeadId[m.lead_id] = {
          type: m.type,
          is_read: m.is_read,
          created_at: m.created_at,
        };
      }
    }
  }

  let tenantUsers: { id: string; name: string | null; email: string }[] = [];
  if (role === 'admin' || role === 'manager') {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('tenant_id', session.user.tenantId);
    tenantUsers = users ?? [];
  }

  const canAssignAndDelete = role === 'admin' || role === 'manager';
  const canCreateLead = role !== 'readonly' && role !== 'support';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-600">
          {role === 'sales' ? 'Leads asignados a ti.' : role === 'manager' ? 'Leads de tu equipo.' : 'Ver y gestionar todos los leads.'}
        </p>
        {canCreateLead && (
          <Link
            href="/dashboard/leads/nuevo"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Nuevo lead
          </Link>
        )}
      </div>
      <LeadsList
        leads={leads ?? []}
        canAssignAndDelete={canAssignAndDelete}
        tenantUsers={tenantUsers}
        currentView={view ?? (role === 'sales' ? 'mine' : 'all')}
        role={role}
        lastMessageByLeadId={lastMessageByLeadId}
      />
    </div>
  );
}

import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { PipelineKanban } from './pipeline-kanban';
import { PipelineHeader } from './pipeline-header';

export default async function PipelinePage() {
  const session = await getSession();
  if (!session) return null;
  const supabase = createServiceClient();
  const role = session.user.role;
  const userId = session.user.id;
  const leadFilter = role === 'sales'
    ? { tenant_id: session.user.tenantId, assigned_to_user_id: userId }
    : { tenant_id: session.user.tenantId };
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('order', { ascending: true });
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .match(leadFilter)
    .order('created_at', { ascending: false });

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

  return (
    <div>
      <PipelineHeader />
      <PipelineKanban
        stages={stages ?? []}
        leads={leads ?? []}
        lastMessageByLeadId={lastMessageByLeadId}
      />
    </div>
  );
}

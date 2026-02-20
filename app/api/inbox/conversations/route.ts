import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError } from '@/lib/api-response';

export type ConversationItem = {
  leadId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stageId: string | null;
  lastMessage: {
    content: string;
    created_at: string;
    type: string;
    is_read: boolean;
  } | null;
};

/**
 * GET /api/inbox/conversations
 * Returns leads that have at least one message, with last message and timestamp.
 * Filtered by tenant and role (sales: only assigned leads).
 */
export async function GET() {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const supabase = createServiceClient();
  const tenantId = session.user.tenantId;

  const { data: messagesByLead } = await supabase
    .from('messages')
    .select('lead_id, content, created_at, type, is_read')
    .eq('tenant_id', tenantId)
    .not('lead_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);

  const leadIds = [...new Set((messagesByLead ?? []).map((m) => m.lead_id).filter(Boolean))] as string[];
  if (leadIds.length === 0) {
    return ok({ conversations: [] });
  }

  let leadsQuery = supabase
    .from('leads')
    .select('id, name, email, phone, stage_id')
    .eq('tenant_id', tenantId)
    .in('id', leadIds);
  if (session.user.role === 'sales') {
    leadsQuery = leadsQuery.eq('assigned_to_user_id', session.user.id);
  }
  const { data: leads, error: leadsError } = await leadsQuery;
  if (leadsError) return serverError(leadsError.message);

  const lastByLead = new Map<string | null, { content: string; created_at: string; type: string; is_read: boolean }>();
  for (const m of messagesByLead ?? []) {
    if (m.lead_id && !lastByLead.has(m.lead_id)) {
      lastByLead.set(m.lead_id, {
        content: m.content,
        created_at: m.created_at,
        type: m.type,
        is_read: m.is_read,
      });
    }
  }

  const conversations: ConversationItem[] = (leads ?? []).map((l) => ({
    leadId: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    stageId: l.stage_id,
    lastMessage: lastByLead.get(l.id) ?? null,
  }));

  conversations.sort((a, b) => {
    const at = a.lastMessage?.created_at ?? '';
    const bt = b.lastMessage?.created_at ?? '';
    return bt.localeCompare(at);
  });

  return ok({ conversations });
}

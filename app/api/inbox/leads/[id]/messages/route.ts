import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError, notFound, forbidden } from '@/lib/api-response';
import { canUpdateLead } from '@/lib/permissions';

export type MessageItem = {
  id: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

/**
 * GET /api/inbox/leads/[id]/messages
 * Returns messages for a lead (oldest first), limit 50. Access: tenant + role (sales = own leads).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const { id: leadId } = await params;
  const supabase = createServiceClient();

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, tenant_id, assigned_to_user_id')
    .eq('id', leadId)
    .single();
  if (leadErr || !lead) return notFound('Lead not found');
  if (lead.tenant_id !== session.user.tenantId) return forbidden();
  if (session.user.role === 'sales' && lead.assigned_to_user_id !== session.user.id) {
    return forbidden();
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, content, type, is_read, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) return serverError(error.message);

  const items: MessageItem[] = (messages ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    type: m.type,
    is_read: m.is_read,
    created_at: m.created_at,
  }));

  return ok({ messages: items });
}

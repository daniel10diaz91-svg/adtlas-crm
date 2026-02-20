import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError, notFound, forbidden } from '@/lib/api-response';
import { canUpdateLead } from '@/lib/permissions';

/**
 * POST /api/inbox/leads/[id]/read
 * Marks all messages for this lead as read. Access: tenant + role (sales = own).
 */
export async function POST(
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

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('lead_id', leadId)
    .eq('tenant_id', session.user.tenantId);

  if (error) return serverError(error.message);
  return ok({ updated: true });
}

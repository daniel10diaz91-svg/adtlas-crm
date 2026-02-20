import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError, notFound, forbidden, validateUuidParam } from '@/lib/api-response';
import { canUpdateLead } from '@/lib/permissions';

/**
 * PATCH /api/messages/[id]
 * Body: { is_read?: boolean }. Marks message as read. Access: tenant + same rules as lead (sales = own).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const { id: messageId } = await params;
  const invalidId = validateUuidParam(messageId);
  if (invalidId) return invalidId;

  const supabase = createServiceClient();
  const { data: message, error: msgErr } = await supabase
    .from('messages')
    .select('id, tenant_id, lead_id')
    .eq('id', messageId)
    .single();
  if (msgErr || !message) return notFound('Message not found');
  if (message.tenant_id !== session.user.tenantId) return forbidden();

  if (message.lead_id) {
    const updateCheck = await canUpdateLead(
      session.user.id,
      session.user.role,
      message.lead_id,
      session.user.tenantId
    );
    if (!updateCheck.allowed) return updateCheck.notFound ? notFound() : forbidden();
  }

  let body: { is_read?: boolean };
  try {
    body = await req.json();
  } catch {
    return ok({ updated: false });
  }
  const isRead = body?.is_read === true;

  const { error: updateErr } = await supabase
    .from('messages')
    .update({ is_read: isRead })
    .eq('id', messageId)
    .eq('tenant_id', session.user.tenantId);

  if (updateErr) return serverError(updateErr.message);
  return ok({ updated: true });
}

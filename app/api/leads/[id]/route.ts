import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { canUpdateLead, canDeleteLead, canSetLeadAssignment } from '@/lib/permissions';
import { ok, serverError, unauthorized, forbidden, notFound, badRequest, validateUuidParam } from '@/lib/api-response';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const { id } = await params;
  const invalidId = validateUuidParam(id);
  if (invalidId) return invalidId;

  const updateCheck = await canUpdateLead(
    session.user.id,
    session.user.role,
    id,
    session.user.tenantId
  );
  if (!updateCheck.allowed) {
    if (updateCheck.notFound) return notFound();
    return forbidden();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const { stage_id, assigned_to_user_id: bodyAssigned } = body as Record<string, unknown>;
  const supabase = createServiceClient();
  const updates: { stage_id?: string | null; assigned_to_user_id?: string | null } = {};
  if (stage_id !== undefined) updates.stage_id = stage_id && typeof stage_id === 'string' ? stage_id : null;
  if (canSetLeadAssignment(session.user) && bodyAssigned !== undefined) {
    updates.assigned_to_user_id =
      bodyAssigned && typeof bodyAssigned === 'string' ? bodyAssigned : null;
  }
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .select()
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const { id } = await params;
  const invalidId = validateUuidParam(id);
  if (invalidId) return invalidId;

  const deleteCheck = await canDeleteLead(
    session.user.id,
    session.user.role,
    id,
    session.user.tenantId
  );
  if (!deleteCheck.allowed) {
    if (deleteCheck.notFound) return notFound();
    return forbidden();
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId);
  if (error) return serverError(error.message);
  return new Response(null, { status: 204 });
}

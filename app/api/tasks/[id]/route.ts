import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { canUpdateTask } from '@/lib/permissions';
import { ok, serverError, notFound, forbidden, badRequest, validateUuidParam } from '@/lib/api-response';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const { id } = await params;
  const invalidId = validateUuidParam(id);
  if (invalidId) return invalidId;

  const updateCheck = await canUpdateTask(
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
  const { done, title, due_at } = body as Record<string, unknown>;
  const updates: { done?: boolean; title?: string; due_at?: string | null } = {};
  if (typeof done === 'boolean') updates.done = done;
  if (title !== undefined) updates.title = typeof title === 'string' ? title : undefined;
  if (due_at !== undefined) updates.due_at = due_at && typeof due_at === 'string' ? due_at : null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .select()
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}

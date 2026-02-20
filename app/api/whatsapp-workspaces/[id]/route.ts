import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError, forbidden, notFound, validateUuidParam } from '@/lib/api-response';
import { isReadOnly } from '@/lib/permissions';

/** DELETE: eliminar un whatsapp_workspace del tenant. Solo admin o manager. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;
  if (isReadOnly(session.user)) return forbidden();

  const { id } = await params;
  const invalidId = validateUuidParam(id);
  if (invalidId) return invalidId;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('whatsapp_workspaces')
    .delete()
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .select('id')
    .single();
  if (error) return serverError(error.message);
  if (!data) return notFound();
  return ok({ deleted: true });
}

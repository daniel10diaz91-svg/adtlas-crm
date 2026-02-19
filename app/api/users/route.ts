import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError } from '@/lib/api-response';

export async function GET() {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  if (session.user.role !== 'admin') {
    return ok({ users: [] });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('tenant_id', session.user.tenantId);
  if (error) return serverError(error.message);
  return ok({ users: data ?? [] });
}

import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { IntegracionesContent } from './integraciones-content';

export default async function IntegracionesPage() {
  const session = await getSession();
  if (!session) return null;
  const supabase = createServiceClient();
  const { data: sources } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('tenant_id', session.user.tenantId);

  const metaSources = sources?.filter((s) => s.origin === 'meta') ?? [];

  return <IntegracionesContent metaSources={metaSources} />;
}

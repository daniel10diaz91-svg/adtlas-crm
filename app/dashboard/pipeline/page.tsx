import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { getServerT } from '@/lib/i18n-server';
import { PipelineKanban } from './pipeline-kanban';

export default async function PipelinePage() {
  const session = await getSession();
  if (!session) return null;
  const t = await getServerT();
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">{t('pipeline.title')}</h1>
      <p className="mt-1 text-zinc-600">
        {t('pipeline.dragHint')}
      </p>
      <PipelineKanban stages={stages ?? []} leads={leads ?? []} />
    </div>
  );
}

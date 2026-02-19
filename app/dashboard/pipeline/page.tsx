import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { PipelineKanban } from './pipeline-kanban';

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;
  const supabase = createServiceClient();
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('order', { ascending: true });
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Pipeline</h1>
      <p className="mt-1 text-zinc-600">
        Drag leads between columns or use the dropdown on each card.
      </p>
      <PipelineKanban stages={stages ?? []} leads={leads ?? []} />
    </div>
  );
}

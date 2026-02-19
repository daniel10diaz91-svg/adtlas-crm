import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect, notFound } from 'next/navigation';
import { LeadDetail } from './lead-detail';

type PageProps = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const supabase = createServiceClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .single();

  if (error || !lead) notFound();
  if (session.user.role === 'support') notFound();
  if (session.user.role === 'sales' && lead.assigned_to_user_id !== session.user.id) notFound();

  const [{ data: stages }, { data: tasks }, { data: tenantUsers }] = await Promise.all([
    supabase.from('pipeline_stages').select('id, name, order').eq('tenant_id', session.user.tenantId).order('order', { ascending: true }),
    supabase.from('tasks').select('*').eq('lead_id', id).order('due_at', { ascending: true, nullsFirst: false }),
    (session.user.role === 'admin' || session.user.role === 'manager')
      ? supabase.from('users').select('id, name, email').eq('tenant_id', session.user.tenantId)
      : { data: [] as { id: string; name: string | null; email: string }[] },
  ]);

  return (
    <LeadDetail
      lead={lead}
      stages={stages ?? []}
      tasks={tasks ?? []}
      tenantUsers={tenantUsers ?? []}
      role={session.user.role}
      canAssign={session.user.role === 'admin' || session.user.role === 'manager'}
      canEdit={session.user.role !== 'readonly' && session.user.role !== 'support'}
    />
  );
}

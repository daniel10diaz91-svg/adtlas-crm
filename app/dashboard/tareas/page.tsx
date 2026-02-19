import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { TasksList } from './TasksList';

export default async function TareasPage() {
  const session = await getSession();
  if (!session) return null;
  const supabase = createServiceClient();
  const role = session.user.role;
  const userId = session.user.id;
  let tasksQuery = supabase
    .from('tasks')
    .select('id, title, due_at, done, lead_id')
    .eq('tenant_id', session.user.tenantId)
    .order('due_at', { ascending: true, nullsFirst: false });
  let tasks: Awaited<ReturnType<typeof supabase.from<'tasks'>>>['data'] = null;
  if (role === 'sales') {
    const { data: myLeadIds } = await supabase
      .from('leads')
      .select('id')
      .eq('tenant_id', session.user.tenantId)
      .eq('assigned_to_user_id', userId);
    const ids = (myLeadIds ?? []).map((l) => l.id);
    if (ids.length === 0) {
      tasks = [];
    } else {
      const { data: tasksData } = await tasksQuery.in('lead_id', ids);
      tasks = tasksData;
    }
  } else {
    const { data: tasksData } = await tasksQuery;
    tasks = tasksData;
  }

  const canCreateTask = role !== 'readonly' && role !== 'support';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-600">Tareas pendientes y recordatorios.</p>
        {canCreateTask && (
          <Link
            href="/dashboard/tareas/nuevo"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Nueva tarea
          </Link>
        )}
      </div>
      <TasksList tasks={tasks ?? []} />
    </div>
  );
}

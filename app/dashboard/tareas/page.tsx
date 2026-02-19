import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { TasksList } from './TasksList';

export default async function TareasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;
  const supabase = createServiceClient();
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_at, done, lead_id')
    .eq('tenant_id', session.user.tenantId)
    .order('due_at', { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-600">Pending items and reminders.</p>
        <Link
          href="/dashboard/tareas/nuevo"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New task
        </Link>
      </div>
      <TasksList tasks={tasks ?? []} />
    </div>
  );
}

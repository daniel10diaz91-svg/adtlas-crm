import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { UsersList } from './users-list';

export default async function AdminUsuariosPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') return null;

  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900">Usuarios</h1>
      <p className="text-zinc-600">
        Gestiona los usuarios de tu organización. Crea nuevos usuarios y asigna roles.
      </p>
      <UsersList users={users ?? []} />
    </div>
  );
}

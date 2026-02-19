import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { getServerT } from '@/lib/i18n-server';
import { UsersList } from './users-list';

export default async function AdminUsuariosPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') return null;
  const t = await getServerT();

  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900">{t('admin.pageTitle')}</h1>
      <p className="text-zinc-600">
        {t('admin.pageDescription')}
      </p>
      <UsersList users={users ?? []} />
    </div>
  );
}

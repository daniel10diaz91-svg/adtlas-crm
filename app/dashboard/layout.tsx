import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const displayName = session.user.tenantName ?? session.user.email ?? 'Account';

  return (
    <DashboardShell displayName={displayName}>
      {children}
    </DashboardShell>
  );
}

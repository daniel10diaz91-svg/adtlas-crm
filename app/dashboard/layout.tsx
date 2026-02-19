import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const displayName = session.user.tenantName ?? session.user.email ?? 'Account';

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="pl-[240px]">
        <TopBar displayName={displayName} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

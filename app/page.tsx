import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-100 p-4">
      <h1 className="text-2xl font-semibold text-zinc-900">Adtlas CRM</h1>
      <p className="text-zinc-600">Manage your leads and pipeline in one place.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          Sign in
        </Link>
        <Link
          href="/registro"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 hover:bg-zinc-50"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

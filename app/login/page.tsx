'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t('auth.invalidCredentials'));
      return;
    }
    const callback = searchParams.get('callbackUrl') || '/dashboard';
    router.push(callback);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">{t('auth.signInToCrm')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600">{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600">{t('auth.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        {t('auth.noAccount')}{' '}
        <Link href="/registro" className="text-zinc-900 underline">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Suspense fallback={<div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6">...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

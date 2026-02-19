/**
 * Centralised session and auth for the CRM.
 * Use getSession() in server components; getSessionOr401() in API routes for consistent 401 handling.
 */
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

/** Session with CRM fields (tenant, role). Use in API routes and server components. */
export type SessionUser = Session['user'] & {
  id: string;
  tenantId: string;
  tenantName: string;
  role: 'admin' | 'ventas';
};

export type SessionWithUser = Session & { user: SessionUser };

function isSessionUser(user: Session['user']): user is SessionUser {
  return (
    typeof (user as SessionUser).id === 'string' &&
    typeof (user as SessionUser).tenantId === 'string' &&
    ((user as SessionUser).role === 'admin' || (user as SessionUser).role === 'ventas')
  );
}

/**
 * Returns the current session or null. Use in server components.
 */
export async function getSession(): Promise<SessionWithUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSessionUser(session.user)) return null;
  return session as SessionWithUser;
}

/**
 * Returns [session, null] or [null, 401 Response]. Use in API routes for consistent auth.
 */
export async function getSessionOr401(): Promise<
  [SessionWithUser, null] | [null, NextResponse]
> {
  const session = await getSession();
  if (!session) return [null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })];
  return [session, null];
}
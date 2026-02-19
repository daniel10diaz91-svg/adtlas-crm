/**
 * Centralised session and auth for the CRM.
 * Use getSession() in server components; getSessionOr401() in API routes for consistent 401 handling.
 */
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

/** CRM roles. 'ventas' from DB is normalized to 'sales' in session. */
export type AppRole = 'admin' | 'manager' | 'sales' | 'support' | 'readonly';

/** Session with CRM fields (tenant, role). Use in API routes and server components. */
export type SessionUser = Session['user'] & {
  id: string;
  tenantId: string;
  tenantName: string;
  role: AppRole;
};

export type SessionWithUser = Session & { user: SessionUser };

const VALID_ROLES: AppRole[] = ['admin', 'manager', 'sales', 'support', 'readonly'];

function normalizeRole(role: string | undefined): AppRole | null {
  if (!role) return null;
  if (role === 'ventas') return 'sales';
  return VALID_ROLES.includes(role as AppRole) ? (role as AppRole) : null;
}

function isSessionUser(user: Session['user']): user is SessionUser {
  const u = user as SessionUser;
  if (typeof u?.id !== 'string' || typeof u?.tenantId !== 'string') return false;
  return normalizeRole(u.role) !== null;
}

/**
 * Returns the current session or null. Use in server components.
 * Normalizes role: ventas -> sales.
 */
export async function getSession(): Promise<SessionWithUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSessionUser(session.user)) return null;
  const role = normalizeRole((session.user as SessionUser).role);
  if (!role) return null;
  (session.user as SessionUser).role = role;
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
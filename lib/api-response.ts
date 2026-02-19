/**
 * Consistent API responses and validation.
 * Use these in all API routes: never expose internal errors or stack traces to the client.
 */
import { NextResponse } from 'next/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message = 'Invalid request') {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Use for DB/server errors. Client sees a generic message; details stay server-side.
 */
export function serverError(logMessage?: string) {
  if (logMessage) console.error('[API Error]', logMessage);
  return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
}

/**
 * Validate UUID route param. Returns null if valid, or a NextResponse to return if invalid.
 */
export function validateUuidParam(id: string | undefined): NextResponse | null {
  if (!id || !UUID_REGEX.test(id)) return badRequest('Invalid id');
  return null;
}

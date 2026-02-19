// Comprueba que las variables mínimas estén definidas (sin revelar valores)
export function getEnvCheck(): { ok: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  return { ok: missing.length === 0, missing };
}

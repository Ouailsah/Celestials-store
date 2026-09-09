import 'server-only';

// All Supabase clients in this app run on the server. Read the deployment's
// runtime environment instead of freezing NEXT_PUBLIC_* values during build.
export function supabaseConfig() {
  // Reflect.get is deliberate: Turbopack also folds aliased env.KEY accesses.
  const read = (key: string): string => Reflect.get(process.env, key)?.trim() || '';
  const url = read('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = read('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = read('SUPABASE_SERVICE_ROLE_KEY');
  return { url, anonKey, serviceRoleKey, configured: Boolean(url && anonKey) };
}

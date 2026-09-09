import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export function publicDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}
export function serviceDb() {
  if (!configured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Store connection is not configured. Please try again later.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function authDb() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => jar.getAll(), setAll: values => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server component: refresh is handled by proxy. */ } } } });
}
export async function requireAdmin() {
  if (!configured()) throw new Error('Admin is unavailable until Supabase is configured.');
  const db = await authDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) throw new Error('Unauthorized');
  return db;
}

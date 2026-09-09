import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './supabase-config';
export const configured = () => supabaseConfig().configured;
export const orderingConfigured = () => { const config = supabaseConfig(); return config.configured && Boolean(config.serviceRoleKey); };
export function publicDb() {
  const { url, anonKey } = supabaseConfig();
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
export function serviceDb() {
  const config = supabaseConfig();
  if (!config.configured || !config.serviceRoleKey) throw new Error('Store connection is not configured. Please try again later.');
  return createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function authDb() {
  const jar = await cookies();
  const { url, anonKey } = supabaseConfig();
  return createServerClient(url, anonKey, { cookies: { getAll: () => jar.getAll(), setAll: values => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server component: refresh is handled by proxy. */ } } } });
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

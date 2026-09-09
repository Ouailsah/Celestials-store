import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { configured, url, anonKey } = supabaseConfig();
  if (!configured) return response;
  const db = createServerClient(url, anonKey, { cookies: { getAll: () => request.cookies.getAll(), setAll: values => { values.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  await db.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/admin/:path*'] };

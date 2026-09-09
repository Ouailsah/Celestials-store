import { AdminLogin } from '@/components/admin-login';
import { configured } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Admin sign in',robots:{index:false,follow:false}};
export default function LoginPage() { return <AdminLogin connected={configured()} />; }

import { Checkout } from '@/components/checkout';
import { configured } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout' };
export default function CheckoutPage() { return <Checkout connected={configured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} />; }

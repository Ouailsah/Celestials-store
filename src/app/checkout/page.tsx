import { Checkout } from '@/components/checkout';
import { orderingConfigured } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout' };
export default function CheckoutPage() { return <Checkout connected={orderingConfigured()} />; }

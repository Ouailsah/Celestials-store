import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase';
import { AdminDashboard } from '@/components/admin-dashboard';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Studio dashboard',robots:{index:false,follow:false}};
export default async function AdminPage({searchParams}:{searchParams:Promise<{page?:string}>}) {
 const db = await requireAdmin().catch(() => null); if (!db) redirect('/admin/login');
 const query=await searchParams; const page=Math.max(1,Math.min(100000,Number.parseInt(query.page || '1',10)||1));
 const [orders,products,outfits] = await Promise.all([db.from('orders').select('*,order_items(*,order_item_components(*))',{count:'exact'}).order('created_at',{ascending:false}).range((page-1)*50,page*50-1),db.from('products').select('*,product_variants(*)').order('created_at',{ascending:false}),db.from('outfits').select('*').order('name')]);
 if (orders.error || products.error || outfits.error) throw new Error('Dashboard data could not be loaded.');
 return <AdminDashboard orders={orders.data || []} products={products.data || []} outfits={outfits.data || []} orderCount={orders.count || 0} page={page} />;
}

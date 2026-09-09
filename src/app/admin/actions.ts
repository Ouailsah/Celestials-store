'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authDb, configured, requireAdmin } from '@/lib/supabase';
import { productSchema, outfitSchema } from '@/lib/validation';
export async function login(form: FormData): Promise<{error:string}> {
 if (!configured()) return {error:'Connect Supabase to enable secure admin sign-in.'};
 const credentials = z.object({email:z.string().email().max(254),password:z.string().min(1).max(128)}).safeParse(Object.fromEntries(form));
 if (!credentials.success) return {error:'Enter a valid email and password.'};
 const db = await authDb(); const {error} = await db.auth.signInWithPassword(credentials.data);
 if (error) return {error:'Unable to sign in. Check your credentials and try again.'};
 try {await requireAdmin();} catch {await db.auth.signOut(); return {error:'This account does not have administrator access.'};}
 redirect('/admin');
}
export async function logout() { if (configured()) await (await authDb()).auth.signOut(); redirect('/admin/login'); }
export async function updateOrder(id:string,status:string) { try { const db = await requireAdmin(); const parsed = z.object({id:z.string().uuid(),status:z.enum(['pending','confirmed','shipped','delivered','cancelled'])}).parse({id,status}); const {error} = await db.rpc('set_order_status',{p_id:parsed.id,p_status:parsed.status}); if (error) return {error:'This status change is not allowed. Refresh and try again.'}; revalidatePath('/','layout'); return {success:true}; } catch {return {error:'Your session is invalid or you do not have permission.'};} }
export async function saveProduct(input:unknown) { try { const db = await requireAdmin(); const parsed = productSchema.safeParse(input); if (!parsed.success) return {error:parsed.error.issues[0].message}; const {error} = await db.rpc('save_product',{p_product:parsed.data}); if (error) return {error:error.message.includes('open orders') ? 'A removed variant has open orders. Set its stock to zero instead.' : 'Could not save. Check that the slug and each size/color combination are unique.'}; revalidatePath('/','layout'); return {success:true}; } catch {return {error:'Your session is invalid or you do not have permission.'};} }
export async function deleteProduct(id:string) { try { const db = await requireAdmin(); if (!z.string().uuid().safeParse(id).success) return {error:'Invalid product.'}; const {error} = await db.rpc('delete_product',{p_id:id}); if (error) return {error:'This piece could not be deleted. If it has open orders or belongs to an outfit, unpublish it instead.'}; revalidatePath('/','layout'); return {success:true}; } catch {return {error:'Your session is invalid or you do not have permission.'};} }
export async function uploadImage(form:FormData) { try { const db = await requireAdmin(); const file = form.get('image'); if (!(file instanceof File) || file.size > 3*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) return {error:'Choose a JPEG, PNG, or WebP image under 3 MB.'}; const ext = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp' }[file.type]; const path = `${crypto.randomUUID()}.${ext}`; const {error} = await db.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false}); if (error) return {error:'Upload failed. Confirm that the product-images storage bucket is configured.'}; return {url:db.storage.from('product-images').getPublicUrl(path).data.publicUrl}; } catch {return {error:'Sign in as an administrator to upload images.'};} }

export async function saveOutfit(input: unknown) {
 try {
  const db = await requireAdmin(); const parsed = outfitSchema.safeParse(input);
  if (!parsed.success) return {error:parsed.error.issues[0].message};
  const {error} = await db.rpc('save_outfit',{p_outfit:parsed.data});
  if(error) return {error:'Could not save outfit. Choose one Top and one Bottom, publish both before publishing the outfit, and use a unique slug.'};
  revalidatePath('/','layout'); return {success:true};
 } catch {return {error:'Your session is invalid or you do not have permission.'};}
}
export async function deleteOutfit(id:string) {
 try {
  const db=await requireAdmin(); if(!z.string().uuid().safeParse(id).success) return {error:'Invalid outfit.'};
  const {error}=await db.rpc('delete_outfit',{p_id:id});
  if(error) return {error:'This outfit could not be deleted. If it has open orders, unpublish it instead.'};
  revalidatePath('/','layout'); return {success:true};
 } catch {return {error:'Your session is invalid or you do not have permission.'};}
}

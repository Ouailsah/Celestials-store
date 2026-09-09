import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { orderSchema } from '@/lib/validation';
import { serviceDb } from '@/lib/supabase';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { validOrderOrigin } from '@/lib/order-origin';
export async function POST(request: Request) {
 if (!validOrderOrigin(request.headers.get('origin'),process.env.NEXT_PUBLIC_SITE_URL,process.env.NODE_ENV)) return NextResponse.json({error:'Invalid request origin.'},{status:403});
 if (Number(request.headers.get('content-length') || 0) > 16000) return NextResponse.json({error:'Request too large.'},{status:413});
 try {
  const text = await request.text(); if (text.length > 16000) return NextResponse.json({error:'Request too large.'},{status:413});
  const parsed = orderSchema.safeParse(JSON.parse(text)); if (!parsed.success) return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
  const db = serviceDb(); const input = parsed.data;
  const {data,error} = await db.rpc('place_order',{p_key:input.idempotencyKey,p_customer:{name:input.name,phone:input.phone,wilaya:input.wilaya,commune:input.commune,address:input.address,notes:input.notes},p_items:input.items});
  if (error) { const safe = ['Insufficient stock','Product unavailable','Too many orders','Invalid order','Unknown variant'].find(s => error.message.includes(s)); return NextResponse.json({error: safe === 'Insufficient stock' ? 'A selected size or color no longer has enough stock. Please update your bag.' : safe === 'Too many orders' ? 'You have placed several orders recently. Please wait before trying again.' : safe ? 'A selected piece is unavailable. Please return to the collection and update your bag.' : 'Your order could not be saved. Please try again.'},{status:409}); }
  const receipt = JSON.stringify({reference:data.reference,total:data.total,expires:Date.now()+86400000}); const encoded = Buffer.from(receipt).toString('base64url'); const signature = createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY!).update(encoded).digest('base64url');
  (await cookies()).set('celestials-receipt',`${encoded}.${signature}`,{httpOnly:true,secure:process.env.NODE_ENV === 'production',sameSite:'lax',path:'/order-confirmation',maxAge:86400});
  return NextResponse.json(data,{status:201});
 } catch(e) { if (e instanceof SyntaxError) return NextResponse.json({error:'Invalid request.'},{status:400}); return NextResponse.json({error:'Ordering is temporarily unavailable. Please try again later.'},{status:503}); }
}

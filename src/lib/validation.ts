import { z } from 'zod';
export const wilayas = ['01 Adrar','02 Chlef','03 Laghouat','04 Oum El Bouaghi','05 Batna','06 Béjaïa','07 Biskra','08 Béchar','09 Blida','10 Bouira','11 Tamanrasset','12 Tébessa','13 Tlemcen','14 Tiaret','15 Tizi Ouzou','16 Alger','17 Djelfa','18 Jijel','19 Sétif','20 Saïda','21 Skikda','22 Sidi Bel Abbès','23 Annaba','24 Guelma','25 Constantine','26 Médéa','27 Mostaganem','28 M’Sila','29 Mascara','30 Ouargla','31 Oran','32 El Bayadh','33 Illizi','34 Bordj Bou Arréridj','35 Boumerdès','36 El Tarf','37 Tindouf','38 Tissemsilt','39 El Oued','40 Khenchela','41 Souk Ahras','42 Tipaza','43 Mila','44 Aïn Defla','45 Naâma','46 Aïn Témouchent','47 Ghardaïa','48 Relizane','49 Timimoun','50 Bordj Badji Mokhtar','51 Ouled Djellal','52 Béni Abbès','53 In Salah','54 In Guezzam','55 Touggourt','56 Djanet','57 El M’Ghair','58 El Meniaa','59 Aflou','60 Barika','61 El Kantara','62 Bir El Ater','63 El Aricha','64 Ksar Chellala','65 Aïn Oussara','66 Messaad','67 Ksar El Boukhari','68 Bou Saada','69 El Abiodh Sidi Cheikh'];
export const orderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  name: z.string().trim().min(3, 'Enter your full name.').max(100),
  phone: z.string().trim().transform(s => s.replace(/[\s()-]/g, '')).refine(s => /^(0[567]\d{8}|\+213[567]\d{8})$/.test(s), 'Enter a valid Algerian mobile number.'),
  wilaya: z.string().refine(s => wilayas.includes(s), 'Choose your wilaya.'),
  commune: z.string().trim().min(2, 'Enter your commune.').max(100),
  address: z.string().trim().min(8, 'Enter your complete delivery address.').max(300),
  notes: z.string().trim().max(500).default(''),
  website: z.string().max(0).optional(),
  items: z.array(z.union([
    z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10), outfitId: z.never().optional(), variantIds: z.never().optional() }),
    z.object({ outfitId: z.string().uuid(), variantIds: z.array(z.string().uuid()).length(2).refine(ids => new Set(ids).size === 2), quantity: z.number().int().min(1).max(10) }).strict(),
  ])).min(1, 'Your bag is empty.').max(30).refine(items => new Set(items.map(i => i.outfitId !== undefined ? i.outfitId + [...i.variantIds].sort().join(':') : i.variantId)).size === items.length, 'Duplicate variants are not allowed.'),
});
export const imageUrl = z.string().max(2048).refine(s => {
  if (/^\/(products|outfits|celestials)\/[a-zA-Z0-9_./-]+$/.test(s)) return !s.split('/').includes('..');
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}, 'Use an HTTPS image URL or an existing store image path.');
const guideSchema = z.object({image:imageUrl,alt:z.string().trim().min(1).max(1000)});
const badgeSchema = z.enum(['NEW ARRIVAL','BEST SELLER','LIMITED RUN','OFFER','']).nullable().transform(s => s || null);
const identity = {id:z.string().uuid(),name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),description:z.string().trim().min(10).max(2000),price:z.number().int().min(1).max(1000000),active:z.boolean(),badge:badgeSchema};
export const productSchema = z.object({...identity,category:z.enum(['Tops','Bottoms','T-Shirts','Hoodies','Outerwear','Accessories']),original_price:z.number().int().min(1).max(1000000).nullable().optional(),size_guide:guideSchema.nullable().optional(),images:z.array(imageUrl).min(1).max(8).refine(a=>new Set(a).size===a.length,'Remove duplicate images.'),product_variants:z.array(z.object({id:z.string().uuid(),size:z.string().trim().min(1).max(12),color:z.string().trim().min(1).max(40),color_hex:z.string().regex(/^#[0-9a-fA-F]{6}$/),stock:z.number().int().min(0).max(100000)})).min(1).max(60).refine(v=>new Set(v.map(x=>x.id)).size===v.length,'Each variant must have its own ID.').refine(v=>new Set(v.map(x=>`${x.size.toLowerCase()}|${x.color.toLowerCase()}`)).size===v.length,'Each size and color combination must be unique.')}).refine(p=>p.original_price==null || p.original_price>=p.price,'Original price must be at least the selling price.');
export const outfitSchema = z.object({...identity,original_price:z.number().int().min(1).max(1000000),images:z.array(imageUrl).min(1).max(8).refine(a=>new Set(a).size===a.length,'Remove duplicate images.'),components:z.array(z.object({product_id:z.string().uuid(),thumbnail:imageUrl.optional(),size_guide:guideSchema.optional()})).length(2).refine(c=>new Set(c.map(x=>x.product_id)).size===2,'Choose two different products.')}).refine(p=>p.original_price>=p.price,'Original price must be at least the selling price.');

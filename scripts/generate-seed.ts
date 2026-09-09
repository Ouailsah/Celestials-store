import { writeFileSync } from 'node:fs';
import { seedProducts } from '../src/lib/catalog';
import { seedOutfits } from '../src/lib/outfits';
const quote = (s:string) => `'${s.replaceAll("'","''")}'`;
let sql = '-- Sample catalog only. Replace illustrative imagery and descriptions before launch.\n';
for(const p of seedProducts) {
 sql += `insert into public.products(id,slug,name,category,price,description,images,badge,active) values(${quote(p.id)},${quote(p.slug)},${quote(p.name)},${quote(p.category)},${p.price},${quote(p.description)},array[${p.images.map(quote).join(',')}],${p.badge?quote(p.badge):'null'},true) on conflict(id) do nothing;\n`;
 for(const v of p.product_variants) sql += `insert into public.product_variants(id,product_id,size,color,color_hex,stock) values(${quote(v.id)},${quote(v.product_id)},${quote(v.size)},${quote(v.color)},${quote(v.color_hex)},${['cursed-blood-manipulation-shirt', 'sakura-long-sleeve', 'sakura-shirt', 'slim-fit-shirt-blue-navy', 'sakura-jeans', 'serpent-hunter-bootcut'].includes(p.slug) ? 0 : v.stock}) on conflict(id) do nothing;\n`;
}
writeFileSync('supabase/seed.sql',sql);
// Additive setup for an existing store. Never overwrite existing product data or stock.
const bootcut = seedProducts.find(p => p.slug === 'serpent-hunter-bootcut')!;
let outfitsSql = '-- Run after migrations/002_outfits.sql. Preview stock is not production stock.\nbegin;\n';
outfitsSql += sql.split('\n').filter(line => line.includes(bootcut.id)).join('\n') + '\n';
outfitsSql += `update public.products set size_guide=${quote(JSON.stringify(bootcut.size_guide))}::jsonb where id=${quote(bootcut.id)} and size_guide is null;\n`;
for (const o of seedOutfits) outfitsSql += `insert into public.outfits(id,slug,name,price,original_price,image,description,active,components) values(${quote(o.id)},${quote(o.slug)},${quote(o.name)},${o.price},${o.original_price},${quote(o.image)},${quote(o.description)},true,${quote(JSON.stringify(o.components))}::jsonb) on conflict(id) do nothing;\n`;
outfitsSql += 'commit;\n';
writeFileSync('supabase/outfits-seed.sql', outfitsSql);
console.log('Generated supabase/seed.sql');

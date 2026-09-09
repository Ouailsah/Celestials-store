-- Apply once to an already-seeded database. Historical order snapshots are retained.
begin;
delete from public.products where lower(trim(category)) in ('tops', 'hoodies', 't-shirts', 'outerwear') and slug <> 'cursed-blood-manipulation-shirt';
-- Sample catalog only. Replace illustrative imagery and descriptions before launch.
insert into public.products(id,slug,name,category,price,description,images,badge,active) values('10000000-0000-4000-8000-000000000007','cursed-blood-manipulation-shirt','Cursed Blood Manipulation Shirt','Tops',3500,'An oversized statement shirt built around the Cursed Blood Manipulation graphic. Cut with a relaxed silhouette and finished with bold red detailing across the back, creating a sharp contrast against the deep black fabric. Designed for an effortless streetwear fit with a strong visual identity.',array['/products/cursed-blood-manipulation/01-cover.jpeg','/products/cursed-blood-manipulation/02-back.jpeg','/products/cursed-blood-manipulation/03-side.jpeg','/products/cursed-blood-manipulation/04-detail.jpeg','/products/cursed-blood-manipulation/05-outfit.jpeg'],'NEW ARRIVAL',true) on conflict(id) do nothing;
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000000700','10000000-0000-4000-8000-000000000007','S','Black','#222222',0) on conflict(id) do nothing;
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000000701','10000000-0000-4000-8000-000000000007','M-L','Black','#222222',0) on conflict(id) do nothing;
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000000702','10000000-0000-4000-8000-000000000007','XL','Black','#222222',0) on conflict(id) do nothing;

commit;

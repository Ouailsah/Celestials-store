-- Replace old Bottoms only. Historical order snapshots are retained.
begin;
delete from public.products where lower(trim(category)) = 'bottoms' and slug <> 'sakura-jeans';
insert into public.products(id,slug,name,category,price,description,images,badge,active) values('10000000-0000-4000-8000-000000000011','sakura-jeans','Sakura Jeans','Bottoms',6000,'Sakura Jeans — a wide-leg black denim piece finished with a subtle Sakura-inspired graphic detail near the upper back pocket. The relaxed silhouette gives the jeans a loose streetwear shape, while the minimal floral accent connects the piece to the Sakura collection without overpowering the design. Built for an easy, oversized fit and everyday styling.',array['/products/sakura-jeans/01-cover.jpeg','/products/sakura-jeans/02-detail.jpeg','/products/sakura-jeans/03-outdoor.jpeg'],'NEW ARRIVAL',true) on conflict(id) do nothing;
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000001100','10000000-0000-4000-8000-000000000011','S','Black','#222222',0) on conflict(id) do nothing;
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000001101','10000000-0000-4000-8000-000000000011','M-L','Black','#222222',0) on conflict(id) do nothing;
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000001102','10000000-0000-4000-8000-000000000011','XL','Black','#222222',0) on conflict(id) do nothing;
commit;

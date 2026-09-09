-- Add XL only; no size-chart measurements are changed. Confirm production inventory in admin.
insert into public.product_variants(id,product_id,size,color,color_hex,stock) values('20000000-0000-4000-8000-000000001102','10000000-0000-4000-8000-000000000011','XL','Black','#222222',0) on conflict(id) do nothing;

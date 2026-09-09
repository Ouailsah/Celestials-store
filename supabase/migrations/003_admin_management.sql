-- Run once after 002_outfits.sql. Existing photography, prices and stock remain intact.
begin;
alter table public.products add column original_price integer check(original_price between price and 1000000);
alter table public.products drop constraint products_badge_check;
alter table public.products add constraint products_badge_check check(badge in ('NEW ARRIVAL','BEST SELLER','LIMITED RUN','OFFER'));
alter table public.outfits add column images text[];
alter table public.outfits add column badge text check(badge in ('NEW ARRIVAL','BEST SELLER','LIMITED RUN','OFFER'));
update public.outfits set images=array[image];
alter table public.outfits alter column images set not null;
alter table public.outfits add constraint outfits_images_check check(cardinality(images) between 1 and 8);
-- Move legacy chart references into the editable database field without copying assets.
update public.products set size_guide=jsonb_build_object('image','/products/sakura-long-sleeve/size-chart.jpeg','alt','Sakura size chart: S, M-L, XL. A: 60, 62, 65. B: 60, 63, 65. C: 73, 74, 76.') where slug in ('sakura-shirt','sakura-long-sleeve') and size_guide is null;
update public.products set size_guide=jsonb_build_object('image','/products/sakura-jeans/size-chart.jpeg','alt','Sakura Jeans size chart. S: length 110, waist 40, thighs 34. M-L: length 113, waist 42, thighs 36.') where slug='sakura-jeans' and size_guide is null;
create function public.sync_outfit_cover() returns trigger language plpgsql set search_path='' as $$
begin
 if new.images is null then new.images:=array[new.image]; end if;
 new.image:=new.images[1];
 return new;
end; $$;
create trigger sync_outfit_cover before insert or update on public.outfits for each row execute function public.sync_outfit_cover();
-- A route slug is unique across products AND outfits. Serialize catalog writes.
create function public.check_catalog_slug() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(704031);
 if TG_TABLE_NAME='products' then
  if exists(select 1 from public.outfits where slug=new.slug) then raise exception 'Slug already used by an outfit'; end if;
 else
  if exists(select 1 from public.products where slug=new.slug) then raise exception 'Slug already used by a product'; end if;
 end if;
 return new;
end; $$;
create trigger check_product_slug before insert or update on public.products for each row execute function public.check_catalog_slug();
create trigger check_outfit_slug before insert or update on public.outfits for each row execute function public.check_catalog_slug();
create or replace function public.save_product(p_product jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare product_id_value uuid:=(p_product->>'id')::uuid; v jsonb;
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 perform pg_advisory_xact_lock(704031);
 if p_product->>'category' not in ('Tops','Bottoms','T-Shirts','Hoodies','Outerwear','Accessories') then raise exception 'Invalid product category'; end if;
 if exists(select 1 from public.outfits o, jsonb_array_elements(o.components) c where c->>'product_id'=product_id_value::text) and (select case when lower(category) in ('tops','t-shirts','hoodies','outerwear') then 'top' else lower(category) end from public.products where id=product_id_value) is distinct from (case when lower(p_product->>'category') in ('tops','t-shirts','hoodies','outerwear') then 'top' else lower(p_product->>'category') end) then raise exception 'Remove this product from its outfits before changing category'; end if;
 if jsonb_typeof(p_product->'product_variants') is distinct from 'array' or jsonb_array_length(p_product->'product_variants') not between 1 and 60 then raise exception 'At least one variant is required'; end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(p_product->'product_variants') x)<>jsonb_array_length(p_product->'product_variants') then raise exception 'Duplicate variant IDs'; end if;
 insert into public.products(id,name,slug,category,price,description,images,badge,active,original_price,size_guide) values(product_id_value,p_product->>'name',p_product->>'slug',p_product->>'category',(p_product->>'price')::integer,p_product->>'description',array(select jsonb_array_elements_text(p_product->'images')),nullif(p_product->>'badge',''),(p_product->>'active')::boolean,(p_product->>'original_price')::integer,nullif(p_product->'size_guide','null'::jsonb))
 on conflict(id) do update set name=excluded.name,slug=excluded.slug,category=excluded.category,price=excluded.price,description=excluded.description,images=excluded.images,badge=excluded.badge,active=excluded.active,original_price=excluded.original_price,size_guide=excluded.size_guide;
 -- Removed variants are deleted; historical order items retain their snapshots.
 -- Prevent deleting variants needed for a pending order's inventory restoration.
 if exists(select 1 from public.product_variants pv join public.order_items oi on oi.variant_id=pv.id join public.orders o on o.id=oi.order_id where pv.product_id=product_id_value and pv.id not in(select (x->>'id')::uuid from jsonb_array_elements(p_product->'product_variants') x) and o.status in ('pending','confirmed')) then raise exception 'A removed variant has open orders. Set its stock to zero instead.'; end if;
 delete from public.product_variants where product_id=product_id_value and id not in(select (x->>'id')::uuid from jsonb_array_elements(p_product->'product_variants') x);
 for v in select value from jsonb_array_elements(p_product->'product_variants') loop
  if exists(select 1 from public.product_variants where id=(v->>'id')::uuid and product_id<>product_id_value) then raise exception 'Variant belongs to another product'; end if;
  insert into public.product_variants(id,product_id,size,color,color_hex,stock) values((v->>'id')::uuid,product_id_value,v->>'size',v->>'color',v->>'color_hex',(v->>'stock')::integer)
  on conflict(id) do update set size=excluded.size,color=excluded.color,color_hex=excluded.color_hex,stock=excluded.stock;
 end loop;
end; $$;
revoke all on function public.save_product(jsonb) from public,anon;
grant execute on function public.save_product(jsonb) to authenticated;

create function public.save_outfit(p_outfit jsonb) returns void language plpgsql security definer set search_path='' as $$
declare c jsonb; top_count integer; bottom_count integer;
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 perform pg_advisory_xact_lock(704031);
 if jsonb_typeof(p_outfit->'components') is distinct from 'array' or jsonb_array_length(p_outfit->'components')<>2
 or length(p_outfit->>'name') not between 2 and 120 or length(p_outfit->>'description') not between 10 and 2000 then raise exception 'Invalid outfit'; end if;
 perform 1 from public.products where id in(select (x->>'product_id')::uuid from jsonb_array_elements(p_outfit->'components') x) order by id for share;
 select count(*) filter(where lower(category) in ('tops','t-shirts','hoodies','outerwear')),count(*) filter(where lower(category)='bottoms') into top_count,bottom_count from public.products where id in(select (x->>'product_id')::uuid from jsonb_array_elements(p_outfit->'components') x);
 if top_count<>1 or bottom_count<>1 then raise exception 'Choose one Top and one Bottom'; end if;
 if (p_outfit->>'active')::boolean and exists(select 1 from public.products where id in(select (x->>'product_id')::uuid from jsonb_array_elements(p_outfit->'components') x) and not active) then raise exception 'Publish both component products first'; end if;
 insert into public.outfits(id,slug,name,description,price,original_price,image,images,badge,active,components)
 values((p_outfit->>'id')::uuid,p_outfit->>'slug',p_outfit->>'name',p_outfit->>'description',(p_outfit->>'price')::integer,(p_outfit->>'original_price')::integer,p_outfit->'images'->>0,array(select jsonb_array_elements_text(p_outfit->'images')),nullif(p_outfit->>'badge',''),(p_outfit->>'active')::boolean,p_outfit->'components')
 on conflict(id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,price=excluded.price,original_price=excluded.original_price,image=excluded.image,images=excluded.images,badge=excluded.badge,active=excluded.active,components=excluded.components;
end; $$;
revoke all on function public.save_outfit(jsonb) from public,anon;
grant execute on function public.save_outfit(jsonb) to authenticated;
create function public.delete_outfit(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 perform 1 from public.outfits where id=p_id for update;
 if exists(select 1 from public.order_items i join public.orders o on o.id=i.order_id where i.outfit_id=p_id and o.status in('pending','confirmed','shipped')) then raise exception 'This outfit has open orders. Unpublish it instead.'; end if;
 delete from public.outfits where id=p_id;
end; $$;
revoke all on function public.delete_outfit(uuid) from public,anon;
grant execute on function public.delete_outfit(uuid) to authenticated;
commit;

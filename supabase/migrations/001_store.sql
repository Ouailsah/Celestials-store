-- Run once in the Supabase SQL editor. All monetary values are whole DZD.
create extension if not exists pgcrypto;
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.admin_users where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
create table public.products (
 id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check (length(name) between 2 and 120), category text not null, price integer not null check(price > 0 and price <= 1000000),
 description text not null, images text[] not null check(cardinality(images) between 1 and 8), badge text check(badge in ('NEW ARRIVAL','BEST SELLER','LIMITED RUN')),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 size text not null, color text not null, color_hex text not null check(color_hex ~ '^#[0-9a-fA-F]{6}$'),
 stock integer not null default 0 check(stock between 0 and 100000), unique(product_id,size,color)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), reference text not null unique default ('CEL-' || upper(encode(gen_random_bytes(5),'hex'))),
 idempotency_key uuid not null unique, customer_name text not null, phone text not null, wilaya text not null, commune text not null, address text not null, notes text not null default '',
 subtotal integer not null check(subtotal>0), shipping integer not null check(shipping>=0), total integer not null check(total=subtotal+shipping),
 status text not null default 'pending' check(status in ('pending','confirmed','shipped','delivered','cancelled')), created_at timestamptz not null default now()
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 variant_id uuid references public.product_variants(id) on delete set null, product_name text not null, size text not null, color text not null,
 unit_price integer not null check(unit_price>0), quantity integer not null check(quantity between 1 and 10), image text not null
);
create index on public.product_variants(product_id);
create index on public.order_items(order_id);
create index on public.orders(phone,created_at);
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy "Admins read own membership" on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
create policy "Public active catalog" on public.products for select to anon,authenticated using(active or (select public.is_admin()));
create policy "Public active variants" on public.product_variants for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.active) or (select public.is_admin()));
create policy "Admins read orders" on public.orders for select to authenticated using((select public.is_admin()));
create policy "Admins read order items" on public.order_items for select to authenticated using((select public.is_admin()));
grant select on public.products,public.product_variants to anon,authenticated;
grant select on public.admin_users,public.orders,public.order_items to authenticated;
revoke insert,update,delete on public.admin_users,public.products,public.product_variants,public.orders,public.order_items from anon,authenticated;

-- This function can ONLY be called by the server's service-role client.
-- Sorted row locks prevent overselling; every insert and decrement commits together.
create function public.place_order(p_key uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; v record; line jsonb; subtotal_value integer:=0; shipping_value integer; phone_value text; order_id_value uuid; qty integer; lines jsonb:='[]'::jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into o from public.orders where idempotency_key=p_key;
 if found then return jsonb_build_object('reference',o.reference,'total',o.total); end if;
 phone_value:=p_customer->>'phone';
 if phone_value !~ '^(0[567][0-9]{8}|\+213[567][0-9]{8})$' or length(p_customer->>'name') not between 3 and 100 or length(p_customer->>'address') not between 8 and 300 or length(p_customer->>'commune') not between 2 and 100 then raise exception 'Invalid order'; end if;
 -- Canonicalize local/international phone forms so the limit covers both.
 phone_value:=regexp_replace(phone_value,'^\+213','0');
 perform pg_advisory_xact_lock(hashtextextended(phone_value,1));
 if (select count(*) from public.orders where phone=phone_value and created_at > now()-interval '1 hour')>=5 then raise exception 'Too many orders'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid order'; end if;
 if (select count(distinct x->>'variantId') from jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) then raise exception 'Invalid order'; end if;
 for line in select value from jsonb_array_elements(p_items) order by value->>'variantId' loop
  qty:=(line->>'quantity')::integer;
  if qty is null or qty not between 1 and 10 then raise exception 'Invalid order'; end if;
  select pv.*,p.name,p.price,p.images,p.active into v from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=(line->>'variantId')::uuid for update of pv,p;
  if not found then raise exception 'Unknown variant'; end if;
  if not v.active then raise exception 'Product unavailable'; end if;
  if v.stock<qty then raise exception 'Insufficient stock'; end if;
  subtotal_value:=subtotal_value+v.price*qty;
  update public.product_variants set stock=stock-qty where id=v.id;
  lines:=lines||jsonb_build_array(jsonb_build_object('variant_id',v.id,'name',v.name,'size',v.size,'color',v.color,'price',v.price,'quantity',qty,'image',v.images[1]));
 end loop;
 shipping_value:=case when subtotal_value>=15000 then 0 else 600 end;
 insert into public.orders(idempotency_key,customer_name,phone,wilaya,commune,address,notes,subtotal,shipping,total) values(p_key,p_customer->>'name',phone_value,p_customer->>'wilaya',p_customer->>'commune',p_customer->>'address',coalesce(p_customer->>'notes',''),subtotal_value,shipping_value,subtotal_value+shipping_value) returning * into o;
 for line in select value from jsonb_array_elements(lines) loop
  insert into public.order_items(order_id,variant_id,product_name,size,color,unit_price,quantity,image) values(o.id,(line->>'variant_id')::uuid,line->>'name',line->>'size',line->>'color',(line->>'price')::integer,(line->>'quantity')::integer,line->>'image');
 end loop;
 return jsonb_build_object('reference',o.reference,'total',o.total);
end; $$;
revoke all on function public.place_order(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.place_order(uuid,jsonb,jsonb) to service_role;

create function public.set_order_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path = '' as $$
declare previous text; line record;
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 select status into previous from public.orders where id=p_id for update;
 if not found then raise exception 'Order not found'; end if;
 if previous=p_status then return; end if;
 if not ((previous='pending' and p_status in ('confirmed','cancelled')) or (previous='confirmed' and p_status in ('shipped','cancelled')) or (previous='shipped' and p_status='delivered')) then raise exception 'Invalid status transition'; end if;
 if p_status='cancelled' then
  for line in select variant_id,quantity from public.order_items where order_id=p_id and variant_id is not null order by variant_id loop
   update public.product_variants set stock=stock+line.quantity where id=line.variant_id;
  end loop;
 end if;
 update public.orders set status=p_status where id=p_id;
end; $$;
revoke all on function public.set_order_status(uuid,text) from public,anon;
grant execute on function public.set_order_status(uuid,text) to authenticated;

create function public.save_product(p_product jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare product_id_value uuid:=(p_product->>'id')::uuid; v jsonb;
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 insert into public.products(id,name,slug,category,price,description,images,badge,active) values(product_id_value,p_product->>'name',p_product->>'slug',p_product->>'category',(p_product->>'price')::integer,p_product->>'description',array(select jsonb_array_elements_text(p_product->'images')),nullif(p_product->>'badge',''),(p_product->>'active')::boolean)
 on conflict(id) do update set name=excluded.name,slug=excluded.slug,category=excluded.category,price=excluded.price,description=excluded.description,images=excluded.images,badge=excluded.badge,active=excluded.active;
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
create function public.delete_product(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 perform 1 from public.products where id=p_id for update;
 if exists(select 1 from public.order_items oi join public.product_variants pv on pv.id=oi.variant_id join public.orders o on o.id=oi.order_id where pv.product_id=p_id and o.status in ('pending','confirmed','shipped')) then raise exception 'This piece has open orders. Unpublish it instead.'; end if;
 delete from public.products where id=p_id;
end; $$;
revoke all on function public.delete_product(uuid) from public,anon;
grant execute on function public.delete_product(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,3145728,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Public product photos" on storage.objects for select to anon,authenticated using(bucket_id='product-images');
create policy "Admin photo upload" on storage.objects for insert to authenticated with check(bucket_id='product-images' and (select public.is_admin()));
create policy "Admin photo update" on storage.objects for update to authenticated using(bucket_id='product-images' and (select public.is_admin())) with check(bucket_id='product-images' and (select public.is_admin()));
create policy "Admin photo delete" on storage.objects for delete to authenticated using(bucket_id='product-images' and (select public.is_admin()));

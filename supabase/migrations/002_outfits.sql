-- Additive outfit support. Run after 001_store.sql, before outfits-seed.sql.
begin;
alter table public.products add column size_guide jsonb;
create table public.outfits (
 id uuid primary key, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), name text not null,
 price integer not null check(price between 1 and 1000000), original_price integer not null check(original_price >= price),
 image text not null, description text not null, active boolean not null default true,
 components jsonb not null check(jsonb_typeof(components)='array' and jsonb_array_length(components)=2)
);
alter table public.outfits enable row level security;
create policy "Public active outfits" on public.outfits for select to anon,authenticated using(active or (select public.is_admin()));
grant select on public.outfits to anon,authenticated;
revoke insert,update,delete on public.outfits from anon,authenticated;
-- Component references are validated on every definition write. A product cannot
-- be deleted while an outfit references it; unpublish or remove the outfit first.
create function public.check_outfit_components() returns trigger language plpgsql set search_path='' as $$
begin
 if (select count(distinct c->>'product_id') from jsonb_array_elements(new.components) c)<>2
 or (select count(*) from public.products p where p.id in(select (c->>'product_id')::uuid from jsonb_array_elements(new.components) c))<>2 then raise exception 'Invalid outfit components'; end if;
 return new;
end; $$;
create trigger check_outfit_components before insert or update on public.outfits for each row execute function public.check_outfit_components();
create function public.protect_outfit_product() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.outfits o, jsonb_array_elements(o.components) c where c->>'product_id'=old.id::text) then raise exception 'This piece belongs to an outfit. Unpublish it or remove the outfit first.'; end if;
 return old;
end; $$;
create trigger protect_outfit_product before delete on public.products for each row execute function public.protect_outfit_product();
alter table public.order_items add column outfit_id uuid references public.outfits(id) on delete set null;
create table public.order_item_components (
 id uuid primary key default gen_random_uuid(), order_item_id uuid not null references public.order_items(id) on delete cascade,
 variant_id uuid references public.product_variants(id) on delete set null,
 product_name text not null, size text not null, color text not null
);
create index on public.order_item_components(order_item_id);
create index on public.order_item_components(variant_id);
alter table public.order_item_components enable row level security;
create policy "Admins read outfit selections" on public.order_item_components for select to authenticated using((select public.is_admin()));
grant select on public.order_item_components to authenticated;
revoke insert,update,delete on public.order_item_components from anon,authenticated;
create function public.protect_outfit_variant() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.order_item_components c join public.order_items i on i.id=c.order_item_id join public.orders o on o.id=i.order_id where c.variant_id=old.id and o.status in('pending','confirmed','shipped')) then raise exception 'This variant has open outfit orders. Set its stock to zero instead.'; end if;
 return old;
end; $$;
create trigger protect_outfit_variant before delete on public.product_variants for each row execute function public.protect_outfit_variant();

create or replace function public.place_order(p_key uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders; outfit public.outfits; line jsonb; comp jsonb; v record; demand record;
 normalized jsonb:='[]'; demands jsonb:='[]'; snapshots jsonb:='[]'; components jsonb; ids jsonb;
 seen text[]:='{}'; identity_value text; qty integer; subtotal_value integer:=0; shipping_value integer; phone_value text; item_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into o from public.orders where idempotency_key=p_key;
 if found then return jsonb_build_object('reference',o.reference,'total',o.total); end if;
 phone_value:=p_customer->>'phone';
 if coalesce(phone_value,'') !~ '^(0[567][0-9]{8}|\+213[567][0-9]{8})$'
 or coalesce(length(p_customer->>'name'),0) not between 3 and 100 or coalesce(length(p_customer->>'address'),0) not between 8 and 300
 or coalesce(length(p_customer->>'commune'),0) not between 2 and 100 or coalesce(length(p_customer->>'wilaya'),0) not between 3 and 100 then raise exception 'Invalid order'; end if;
 phone_value:=regexp_replace(phone_value,'^\+213','0');
 perform pg_advisory_xact_lock(hashtextextended(phone_value,1));
 if (select count(*) from public.orders where phone=phone_value and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many orders'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid order'; end if;
 -- Normalize selections, then lock all involved rows in the same order, even
 -- when a basket contains both an outfit and its individual components.
 for line in select value from jsonb_array_elements(p_items) loop
  if coalesce(line->>'quantity','') !~ '^[0-9]+$' then raise exception 'Invalid order'; end if;
  qty:=(line->>'quantity')::integer;
  if qty not between 1 and 10 then raise exception 'Invalid order'; end if;
  if line ? 'outfitId' then
   if line ? 'variantId' or jsonb_typeof(line->'variantIds') is distinct from 'array' then raise exception 'Invalid order'; end if;
   ids:=line->'variantIds';
   if jsonb_array_length(ids)<>2 or (select count(distinct x) from jsonb_array_elements_text(ids) x)<>2 then raise exception 'Invalid order'; end if;
   identity_value:=(line->>'outfitId') || (select string_agg(x,':' order by x) from jsonb_array_elements_text(ids) x);
  else
   if line ? 'variantIds' or not line ? 'variantId' then raise exception 'Invalid order'; end if;
   ids:=jsonb_build_array(line->>'variantId'); identity_value:=line->>'variantId';
  end if;
  if identity_value=any(seen) then raise exception 'Invalid order'; end if;
  seen:=array_append(seen,identity_value);
  normalized:=normalized||jsonb_build_array(line||jsonb_build_object('ids',ids));
  for comp in select value from jsonb_array_elements(ids) loop
   demands:=demands||jsonb_build_array(jsonb_build_object('id',comp,'quantity',qty));
  end loop;
 end loop;
 perform 1 from public.outfits where id in(select (x->>'outfitId')::uuid from jsonb_array_elements(normalized) x where x ? 'outfitId') order by id for share;
 perform 1 from public.products where id in(select product_id from public.product_variants where id in(select (x->>'id')::uuid from jsonb_array_elements(demands) x)) order by id for share;
 perform 1 from public.product_variants where id in(select (x->>'id')::uuid from jsonb_array_elements(demands) x) order by id for update;
 for line in select value from jsonb_array_elements(normalized) loop
  qty:=(line->>'quantity')::integer; components:='[]';
  for v in select pv.*,p.name,p.price,p.images,p.active from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id in(select x::uuid from jsonb_array_elements_text(line->'ids') x) order by pv.product_id loop
   if not v.active then raise exception 'Product unavailable'; end if;
   components:=components||jsonb_build_array(jsonb_build_object('variant_id',v.id,'product_id',v.product_id,'name',v.name,'size',v.size,'color',v.color,'price',v.price,'image',v.images[1]));
  end loop;
  if jsonb_array_length(components)<>jsonb_array_length(line->'ids') then raise exception 'Unknown variant'; end if;
  if line ? 'outfitId' then
   select * into outfit from public.outfits where id=(line->>'outfitId')::uuid and active;
   if not found then raise exception 'Product unavailable'; end if;
   if (select array_agg(c->>'product_id' order by c->>'product_id') from jsonb_array_elements(components) c) is distinct from (select array_agg(c->>'product_id' order by c->>'product_id') from jsonb_array_elements(outfit.components) c) then raise exception 'Invalid order'; end if;
   subtotal_value:=subtotal_value+outfit.price*qty;
   snapshots:=snapshots||jsonb_build_array(jsonb_build_object('outfit_id',outfit.id,'name',outfit.name,'price',outfit.price,'image',outfit.image,'quantity',qty,'size',(select string_agg((c->>'name')||': '||(c->>'size'),' / ') from jsonb_array_elements(components) c),'color','Outfit','components',components));
  else
   comp:=components->0;
   subtotal_value:=subtotal_value+(comp->>'price')::integer*qty;
   snapshots:=snapshots||jsonb_build_array(comp||jsonb_build_object('quantity',qty));
  end if;
 end loop;
 for demand in select (x->>'id')::uuid as id,sum((x->>'quantity')::integer)::integer as quantity from jsonb_array_elements(demands) x group by 1 order by 1 loop
  update public.product_variants set stock=stock-demand.quantity where id=demand.id and stock>=demand.quantity;
  if not found then raise exception 'Insufficient stock'; end if;
 end loop;
 shipping_value:=case when subtotal_value>=15000 then 0 else 600 end;
 insert into public.orders(idempotency_key,customer_name,phone,wilaya,commune,address,notes,subtotal,shipping,total) values(p_key,p_customer->>'name',phone_value,p_customer->>'wilaya',p_customer->>'commune',p_customer->>'address',coalesce(p_customer->>'notes',''),subtotal_value,shipping_value,subtotal_value+shipping_value) returning * into o;
 for line in select value from jsonb_array_elements(snapshots) loop
  insert into public.order_items(order_id,variant_id,outfit_id,product_name,size,color,unit_price,quantity,image) values(o.id,(line->>'variant_id')::uuid,(line->>'outfit_id')::uuid,line->>'name',line->>'size',line->>'color',(line->>'price')::integer,(line->>'quantity')::integer,line->>'image') returning id into item_id;
  for comp in select value from jsonb_array_elements(coalesce(line->'components','[]')) loop
   insert into public.order_item_components(order_item_id,variant_id,product_name,size,color) values(item_id,(comp->>'variant_id')::uuid,comp->>'name',comp->>'size',comp->>'color');
  end loop;
 end loop;
 return jsonb_build_object('reference',o.reference,'total',o.total);
end; $$;
revoke all on function public.place_order(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.place_order(uuid,jsonb,jsonb) to service_role;
create or replace function public.set_order_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare previous text; line record;
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 select status into previous from public.orders where id=p_id for update;
 if not found then raise exception 'Order not found'; end if;
 if previous=p_status then return; end if;
 if not ((previous='pending' and p_status in('confirmed','cancelled')) or (previous='confirmed' and p_status in('shipped','cancelled')) or (previous='shipped' and p_status='delivered')) then raise exception 'Invalid status transition'; end if;
 if p_status='cancelled' then
  for line in select variant_id,sum(quantity)::integer as quantity from (
   select variant_id,quantity from public.order_items where order_id=p_id
   union all select c.variant_id,i.quantity from public.order_item_components c join public.order_items i on i.id=c.order_item_id where i.order_id=p_id
  ) selections where variant_id is not null group by variant_id order by variant_id loop
   update public.product_variants set stock=stock+line.quantity where id=line.variant_id;
  end loop;
 end if;
 update public.orders set status=p_status where id=p_id;
end; $$;
revoke all on function public.set_order_status(uuid,text) from public,anon;
grant execute on function public.set_order_status(uuid,text) to authenticated;
commit;

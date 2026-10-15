-- Two bug fixes found during Phase 2A.
--
-- 1. site_settings had row level security DISABLED, so anyone with the public
--    anon key could change the delivery charge, phone, WhatsApp, etc.
--    Enable RLS and keep public read access (the storefront needs it).
--    The existing "Admins manage site settings" policy now takes effect.
--
-- 2. create_cod_order failed for every order without a coupon:
--      record "v_coupon" is not assigned yet
--    because the insert read v_coupon.id when no coupon was looked up.
--    Fix: copy the coupon id/code into plain variables. Everything else in the
--    function is the same as migration 20260901180000.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. site_settings
-- ---------------------------------------------------------------------------

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

-- ---------------------------------------------------------------------------
-- 2. create_cod_order
-- ---------------------------------------------------------------------------

create or replace function public.create_cod_order(
  customer_address jsonb,
  coupon_code_input text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart uuid;
  v_item record;
  v_product record;
  v_subtotal numeric := 0;
  v_delivery numeric;
  v_threshold numeric;
  v_order uuid;
  v_number text;
  v_coupon record;
  v_coupon_id uuid;     -- new: null when no coupon is used
  v_coupon_code text;   -- new: null when no coupon is used
  v_discount numeric := 0;
begin
  select id into v_cart from public.carts where user_id = auth.uid();
  if v_cart is null or not exists (select 1 from public.cart_items where cart_id = v_cart) then
    raise exception 'Your cart is empty';
  end if;

  for v_item in select * from public.cart_items where cart_id = v_cart loop
    select * into v_product
    from public.products
    where id = v_item.product_id and status = 'active'
    for update;
    if not found or v_product.stock_quantity < v_item.quantity then
      raise exception 'One or more items are no longer available';
    end if;
    v_subtotal := v_subtotal + coalesce(v_product.sale_price, v_product.original_price) * v_item.quantity;
  end loop;

  if nullif(trim(coupon_code_input), '') is not null then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(coupon_code_input))
      and active
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
    for update;
    if not found
      or v_subtotal < v_coupon.minimum_order_value
      or (v_coupon.usage_limit is not null
          and (select count(*) from public.coupon_usages where coupon_id = v_coupon.id) >= v_coupon.usage_limit)
      or (v_coupon.per_user_usage_limit is not null
          and (select count(*) from public.coupon_usages where coupon_id = v_coupon.id and user_id = auth.uid()) >= v_coupon.per_user_usage_limit)
    then
      raise exception 'This coupon is not valid for your order';
    end if;
    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;
    v_discount := case
      when v_coupon.type = 'percentage' then v_subtotal * v_coupon.discount_value / 100
      else v_coupon.discount_value
    end;
    if v_coupon.maximum_discount is not null then
      v_discount := least(v_discount, v_coupon.maximum_discount);
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  select delivery_charge, free_delivery_threshold into v_delivery, v_threshold
  from public.site_settings where id = true;
  if v_threshold is not null and v_subtotal - v_discount >= v_threshold then
    v_delivery := 0;
  end if;

  v_number := 'BLV-' || to_char(now(), 'YYYYMMDD') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_number, user_id, customer_address, subtotal, delivery_charge,
    coupon_code, coupon_discount, total
  ) values (
    v_number, auth.uid(), customer_address, v_subtotal, v_delivery,
    v_coupon_code, v_discount, v_subtotal - v_discount + v_delivery
  )
  returning id into v_order;

  if v_coupon_id is not null then
    insert into public.coupon_usages (coupon_id, user_id, order_id)
    values (v_coupon_id, auth.uid(), v_order);
  end if;

  for v_item in select * from public.cart_items where cart_id = v_cart loop
    select * into v_product from public.products where id = v_item.product_id;
    insert into public.order_items (
      order_id, product_id, product_name, sku, unit_price, quantity, line_total
    ) values (
      v_order, v_product.id, v_product.name, v_product.sku,
      coalesce(v_product.sale_price, v_product.original_price),
      v_item.quantity,
      coalesce(v_product.sale_price, v_product.original_price) * v_item.quantity
    );
    update public.products
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_product.id;
  end loop;

  delete from public.cart_items where cart_id = v_cart;
  return v_number;
end;
$$;

-- Unchanged permissions (create or replace keeps them; restated for clarity).
revoke all on function public.create_cod_order(jsonb, text) from public;
grant execute on function public.create_cod_order(jsonb, text) to authenticated;

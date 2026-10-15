-- Coupon double-use gap: create_cod_order() (the logged-in checkout) counts
-- a coupon's per-customer usage limit only by auth.uid(). create_guest_cod_order()
-- (added in 20261016140000_guest_checkout.sql) counts it by phone number
-- instead, specifically so a coupon used once as a guest still counts once
-- that same customer logs in. But create_cod_order was never updated to do
-- the same check in the other direction, so: use a coupon once as a guest
-- (phone X, coupon_usages.user_id is null) -> sign up -> log in -> use the
-- same coupon again through the normal account checkout, which only looks
-- at coupon_usages.user_id and has never seen this account place an order.
--
-- Fix: create_cod_order now counts usage the same way create_guest_cod_order
-- does -- by this account's own past usages (auth.uid()) OR by phone number
-- match against the address on this order, checked against both
-- orders.guest_phone and orders.customer_address ->> 'phone' on every past
-- order that used the coupon. Everything else is unchanged from the current
-- live version (20261016130000_fix_checkout_and_site_settings.sql).
--
-- Safe to re-run: create or replace.

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
  v_coupon_id uuid;
  v_coupon_code text;
  v_discount numeric := 0;
  v_phone text;
  v_customer_uses bigint;
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
    if not found then
      raise exception 'This coupon is not valid for your order';
    end if;

    -- Same customer, same coupon, whether they used it as a guest or
    -- through an account: matched by this account's own past usages, or by
    -- phone number against every past order that used this coupon.
    v_phone := public.normalize_bd_phone(customer_address ->> 'phone');
    select count(*) into v_customer_uses
    from public.coupon_usages cu
    join public.orders o on o.id = cu.order_id
    where cu.coupon_id = v_coupon.id
      and (
        cu.user_id = auth.uid()
        or (
          v_phone is not null
          and (
            o.guest_phone = v_phone
            or public.normalize_bd_phone(o.customer_address ->> 'phone') = v_phone
          )
        )
      );

    if v_subtotal < v_coupon.minimum_order_value
      or (v_coupon.usage_limit is not null
          and (select count(*) from public.coupon_usages where coupon_id = v_coupon.id) >= v_coupon.usage_limit)
      or (v_coupon.per_user_usage_limit is not null and v_customer_uses >= v_coupon.per_user_usage_limit)
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

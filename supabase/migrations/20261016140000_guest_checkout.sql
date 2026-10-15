-- Guest checkout: place a Cash on Delivery order without an account.
--
-- The guest's cart lives in their browser and is sent with the order. Prices,
-- stock, coupon and delivery charge are all worked out here from the database;
-- nothing from the browser is trusted except product ids and quantities.
--
-- Limits (to stop fake orders tying up stock):
--   * valid Bangladesh mobile number required (01[3-9]XXXXXXXX, +880/880 allowed)
--   * at most 20 different products, 1-10 of each per order
--   * at most 3 open (pending or confirmed) guest orders per mobile number
--   * a coupon's per-customer limit is counted by mobile number for guests
--
-- Guests cannot read orders afterwards (no RLS change); the success page only
-- shows the order number. Admins see guest orders like any other order.
-- Existing logged-in checkout (create_cod_order) is unchanged.
-- Safe to re-run.

-- Orders and coupon usages can now exist without a user account.
alter table public.orders alter column user_id drop not null;
alter table public.coupon_usages alter column user_id drop not null;

-- Normalised mobile number of the person who placed a guest order.
alter table public.orders add column if not exists guest_phone text;

create index if not exists orders_guest_phone_open_idx
  on public.orders (guest_phone, status)
  where guest_phone is not null;

-- Returns the number as 01XXXXXXXXX, or null if it is not a valid BD mobile.
create or replace function public.normalize_bd_phone(raw text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when d ~ '^01[3-9][0-9]{8}$' then d
    when d ~ '^8801[3-9][0-9]{8}$' then substr(d, 3)
    else null
  end
  from (select regexp_replace(coalesce(raw, ''), '[^0-9]', '', 'g') as d) s;
$$;

create or replace function public.create_guest_cod_order(
  customer_address jsonb,
  items jsonb,
  coupon_code_input text default null
)
returns text
language plpgsql
security definer
-- pg_temp last: temp tables can never shadow the public tables used here.
set search_path = public, pg_temp
as $$
declare
  v_phone text;
  v_lines record;
  v_product record;
  v_line_count integer;
  v_subtotal numeric := 0;
  v_delivery numeric;
  v_threshold numeric;
  v_order uuid;
  v_number text;
  v_coupon record;
  v_coupon_id uuid;
  v_coupon_code text;
  v_discount numeric := 0;
  v_customer_uses bigint;
begin
  -- 1. Delivery details
  if customer_address is null or jsonb_typeof(customer_address) <> 'object' then
    raise exception 'Please fill in your delivery details';
  end if;
  if coalesce(trim(customer_address ->> 'full_name'), '') = ''
    or coalesce(trim(customer_address ->> 'division'), '') = ''
    or coalesce(trim(customer_address ->> 'district'), '') = ''
    or coalesce(trim(customer_address ->> 'area'), '') = ''
    or coalesce(trim(customer_address ->> 'full_address'), '') = ''
  then
    raise exception 'Please fill in your delivery details';
  end if;
  if length(customer_address::text) > 4000 then
    raise exception 'Delivery details are too long';
  end if;

  v_phone := public.normalize_bd_phone(customer_address ->> 'phone');
  if v_phone is null then
    raise exception 'Please enter a valid Bangladesh mobile number (01XXXXXXXXX)';
  end if;

  -- 2. Items: [{ "product_id": uuid, "quantity": int }, ...]
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  begin
    create temporary table if not exists pg_temp.guest_order_lines (
      product_id uuid primary key,
      quantity integer not null
    ) on commit drop;
    truncate pg_temp.guest_order_lines;
    insert into pg_temp.guest_order_lines (product_id, quantity)
    select (e ->> 'product_id')::uuid, sum((e ->> 'quantity')::integer)
    from jsonb_array_elements(items) e
    group by 1;
  exception when invalid_text_representation or numeric_value_out_of_range or not_null_violation then
    raise exception 'Your cart has an invalid item. Please refresh your cart.';
  end;

  select count(*) into v_line_count from pg_temp.guest_order_lines;
  if v_line_count > 20 then
    raise exception 'Too many different items in one order (maximum 20)';
  end if;
  if exists (select 1 from pg_temp.guest_order_lines where quantity < 1 or quantity > 10) then
    raise exception 'You can order between 1 and 10 of each item';
  end if;

  -- 3. Open-order limit per phone. The advisory lock makes two orders from the
  --    same number at the same moment wait for each other.
  perform pg_advisory_xact_lock(hashtext('guest_order:' || v_phone));
  if (
    select count(*) from public.orders
    where guest_phone = v_phone and status in ('pending', 'confirmed')
  ) >= 3 then
    raise exception 'This mobile number already has 3 open orders. Please wait for them to be confirmed or contact us.';
  end if;

  -- 4. Lock products (fixed order, avoids deadlocks) and check stock
  for v_lines in select * from pg_temp.guest_order_lines order by product_id loop
    select * into v_product
    from public.products
    where id = v_lines.product_id and status = 'active'
    for update;
    if not found or v_product.stock_quantity < v_lines.quantity then
      raise exception 'One or more items are no longer available';
    end if;
    v_subtotal := v_subtotal + coalesce(v_product.sale_price, v_product.original_price) * v_lines.quantity;
  end loop;

  -- 5. Coupon (same rules as create_cod_order; per-customer limit by phone)
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

    select count(*) into v_customer_uses
    from public.coupon_usages cu
    join public.orders o on o.id = cu.order_id
    where cu.coupon_id = v_coupon.id
      and (
        o.guest_phone = v_phone
        or public.normalize_bd_phone(o.customer_address ->> 'phone') = v_phone
        or (auth.uid() is not null and cu.user_id = auth.uid())
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

  -- 6. Delivery charge (same rule as create_cod_order)
  select delivery_charge, free_delivery_threshold into v_delivery, v_threshold
  from public.site_settings where id = true;
  if v_threshold is not null and v_subtotal - v_discount >= v_threshold then
    v_delivery := 0;
  end if;

  -- 7. Create the order
  v_number := 'BLV-' || to_char(now(), 'YYYYMMDD') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_number, user_id, guest_phone, customer_address, subtotal, delivery_charge,
    coupon_code, coupon_discount, total
  ) values (
    v_number, auth.uid(), v_phone,
    customer_address || jsonb_build_object('phone', v_phone),
    v_subtotal, v_delivery, v_coupon_code, v_discount, v_subtotal - v_discount + v_delivery
  )
  returning id into v_order;

  if v_coupon_id is not null then
    insert into public.coupon_usages (coupon_id, user_id, order_id)
    values (v_coupon_id, auth.uid(), v_order);
  end if;

  for v_lines in select * from pg_temp.guest_order_lines order by product_id loop
    select * into v_product from public.products where id = v_lines.product_id;
    insert into public.order_items (
      order_id, product_id, product_name, sku, unit_price, quantity, line_total
    ) values (
      v_order, v_product.id, v_product.name, v_product.sku,
      coalesce(v_product.sale_price, v_product.original_price),
      v_lines.quantity,
      coalesce(v_product.sale_price, v_product.original_price) * v_lines.quantity
    );
    update public.products
    set stock_quantity = stock_quantity - v_lines.quantity
    where id = v_product.id;
  end loop;

  return v_number;
end;
$$;

-- Guests use the anon key, so anon must be able to call it.
revoke all on function public.create_guest_cod_order(jsonb, jsonb, text) from public;
grant execute on function public.create_guest_cod_order(jsonb, jsonb, text) to anon, authenticated;

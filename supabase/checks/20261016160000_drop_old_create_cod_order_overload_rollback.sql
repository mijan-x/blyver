-- Rollback for migration 20261016160000_drop_old_create_cod_order_overload.sql.
-- Re-creates the old single-argument overload exactly as it was defined in
-- migration 20260901140000_create_orders.sql.

begin;

create or replace function public.create_cod_order(customer_address jsonb)
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
  v_order uuid;
  v_number text;
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
  select delivery_charge into v_delivery from public.site_settings where id = true;
  v_number := 'BLV-' || to_char(now(), 'YYYYMMDD') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.orders (order_number, user_id, customer_address, subtotal, delivery_charge, total)
  values (v_number, auth.uid(), customer_address, v_subtotal, v_delivery, v_subtotal + v_delivery)
  returning id into v_order;
  for v_item in select * from public.cart_items where cart_id = v_cart loop
    select * into v_product from public.products where id = v_item.product_id;
    insert into public.order_items (order_id, product_id, product_name, sku, unit_price, quantity, line_total)
    values (
      v_order, v_product.id, v_product.name, v_product.sku,
      coalesce(v_product.sale_price, v_product.original_price),
      v_item.quantity,
      coalesce(v_product.sale_price, v_product.original_price) * v_item.quantity
    );
    update public.products set stock_quantity = stock_quantity - v_item.quantity where id = v_product.id;
  end loop;
  delete from public.cart_items where cart_id = v_cart;
  return v_number;
end;
$$;

revoke all on function public.create_cod_order(jsonb) from public;
grant execute on function public.create_cod_order(jsonb) to authenticated;

commit;

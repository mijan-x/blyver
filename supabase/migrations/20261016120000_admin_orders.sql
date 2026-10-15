-- Phase 2A: admin access to orders.
--
-- 1. Admins can read every order, order item and coupon usage (read-only; no
--    direct insert/update/delete policies, so all writes go through functions).
-- 2. admin_update_order_status(): the only way to change an order's status.
--    Enforces allowed transitions and restores stock exactly once on
--    cancelled/returned.
-- 3. Indexes for the order lists.
--
-- Customer details come from orders.customer_address; auth.users is not exposed.
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- 1. Read access for admins
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items"
  on public.order_items for select to authenticated
  using ((select public.is_admin()));

-- Needed to show coupon usage per coupon in the admin area.
drop policy if exists "Admins can view all coupon usages" on public.coupon_usages;
create policy "Admins can view all coupon usages"
  on public.coupon_usages for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2. Status changes
-- ---------------------------------------------------------------------------

-- Set when stock for this order has been put back. The guard against a double
-- restore: once set, it is never restored again.
alter table public.orders
  add column if not exists stock_restored_at timestamptz;

-- Allowed transitions (anything else is rejected, including "same status"):
--   pending          -> confirmed, cancelled
--   confirmed        -> processing, cancelled
--   processing       -> shipped, cancelled
--   shipped          -> out_for_delivery, delivered, returned
--   out_for_delivery -> delivered, returned
--   delivered        -> returned
--   cancelled, returned: final
create or replace function public.admin_update_order_status(
  order_id uuid,
  new_status public.order_status
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_allowed public.order_status[];
  v_item record;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only admins can update order status'
      using errcode = '42501';
  end if;

  if new_status is null then
    raise exception 'New status is required' using errcode = '22004';
  end if;

  -- Lock the order so two admins (or a double click) cannot race.
  select * into v_order
  from public.orders o
  where o.id = admin_update_order_status.order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  v_allowed := case v_order.status
    when 'pending'          then array['confirmed', 'cancelled']::public.order_status[]
    when 'confirmed'        then array['processing', 'cancelled']::public.order_status[]
    when 'processing'       then array['shipped', 'cancelled']::public.order_status[]
    when 'shipped'          then array['out_for_delivery', 'delivered', 'returned']::public.order_status[]
    when 'out_for_delivery' then array['delivered', 'returned']::public.order_status[]
    when 'delivered'        then array['returned']::public.order_status[]
    else array[]::public.order_status[]  -- cancelled, returned
  end;

  if not (new_status = any (v_allowed)) then
    raise exception 'Cannot change order % from % to %',
      v_order.order_number, v_order.status, new_status
      using errcode = '22023';
  end if;

  if new_status in ('cancelled', 'returned') and v_order.stock_restored_at is null then
    -- Lock products in a fixed order to avoid deadlocks with checkout.
    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      where oi.order_id = v_order.id
      group by oi.product_id
      order by oi.product_id
    loop
      update public.products p
      set stock_quantity = p.stock_quantity + v_item.quantity
      where p.id = v_item.product_id;
    end loop;

    update public.orders o
    set status = new_status, stock_restored_at = now()
    where o.id = v_order.id
    returning * into v_order;
  else
    update public.orders o
    set status = new_status
    where o.id = v_order.id
    returning * into v_order;
  end if;

  return v_order;
end;
$$;

-- Supabase grants EXECUTE on new public functions to anon by default, so
-- revoke from anon explicitly as well as from public.
revoke all on function public.admin_update_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.admin_update_order_status(uuid, public.order_status) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Indexes (none of these existed; orders only had the order_number index)
-- ---------------------------------------------------------------------------

-- Admin order list, newest first.
create index if not exists orders_created_at_idx
  on public.orders (created_at desc);
-- Admin filter by status.
create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);
-- Customer "My orders" and the per-user RLS check.
create index if not exists orders_user_created_at_idx
  on public.orders (user_id, created_at desc);
-- Foreign keys without indexes: order detail joins, ON DELETE CASCADE from
-- orders, the product FK check, and the reviews insert policy.
create index if not exists order_items_order_idx
  on public.order_items (order_id);
create index if not exists order_items_product_idx
  on public.order_items (product_id);

-- Checks for migration 20261016120000_admin_orders.sql.
-- Run on a DEVELOPMENT project in the Supabase SQL editor.
--
-- Before running, replace the two emails below:
--   ADMIN_EMAIL    = an account with role 'admin' in public.user_roles
--   CUSTOMER_EMAIL = a normal customer account that has at least one order
--
-- Each check is a DO block. If it fails it stops with "FAIL: ...".
-- If every block passes, the last query prints the PASS rows.
-- Check 4 changes stock and order status, then rolls them back,
-- so the script leaves no data changed.

-- Check 1: an admin sees every order and every order item.
do $$
declare
  v_admin uuid := (select id from auth.users where email = 'ADMIN_EMAIL');
  v_total_orders bigint := (select count(*) from public.orders);
  v_total_items bigint := (select count(*) from public.order_items);
  v_seen_orders bigint;
  v_seen_items bigint;
begin
  if v_admin is null then raise exception 'FAIL: ADMIN_EMAIL not found in auth.users'; end if;
  if not exists (select 1 from public.user_roles where user_id = v_admin and role = 'admin') then
    raise exception 'FAIL: ADMIN_EMAIL does not have the admin role in public.user_roles';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_seen_orders from public.orders;
  select count(*) into v_seen_items from public.order_items;
  reset role;
  if v_seen_orders <> v_total_orders or v_seen_items <> v_total_items then
    raise exception 'FAIL: admin sees % of % orders and % of % items',
      v_seen_orders, v_total_orders, v_seen_items, v_total_items;
  end if;
end $$;

-- Check 2: a normal user sees only their own orders and order items.
do $$
declare
  v_user uuid := (select id from auth.users where email = 'CUSTOMER_EMAIL');
  v_own bigint;
  v_seen bigint;
  v_foreign bigint;
  v_foreign_items bigint;
begin
  if v_user is null then raise exception 'FAIL: CUSTOMER_EMAIL not found in auth.users'; end if;
  if exists (select 1 from public.user_roles where user_id = v_user and role = 'admin') then
    raise exception 'FAIL: CUSTOMER_EMAIL is an admin; pick a normal customer';
  end if;
  select count(*) into v_own from public.orders where user_id = v_user;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*), count(*) filter (where user_id <> v_user) into v_seen, v_foreign from public.orders;
  select count(*) into v_foreign_items
  from public.order_items oi
  where not exists (select 1 from public.orders o where o.id = oi.order_id and o.user_id = v_user);
  reset role;
  if v_seen <> v_own or v_foreign <> 0 or v_foreign_items <> 0 then
    raise exception 'FAIL: customer sees % orders (owns %), % foreign orders, % foreign items',
      v_seen, v_own, v_foreign, v_foreign_items;
  end if;
end $$;

-- Check 3: a normal user and an anonymous visitor cannot change order status.
do $$
declare
  v_user uuid := (select id from auth.users where email = 'CUSTOMER_EMAIL');
  v_order uuid := (select id from public.orders order by created_at desc limit 1);
  v_state text;
begin
  if v_order is null then raise exception 'FAIL: no orders exist to test with'; end if;

  -- Logged-in customer: the function runs but rejects them.
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.admin_update_order_status(v_order, 'cancelled');
    reset role;
    raise exception 'FAIL: customer was able to change an order status';
  exception when insufficient_privilege then
    reset role;  -- expected
  end;

  -- Anonymous visitor: no EXECUTE permission at all.
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    perform public.admin_update_order_status(v_order, 'cancelled');
    reset role;
    raise exception 'FAIL: anon was able to call admin_update_order_status';
  exception when insufficient_privilege then
    reset role;  -- expected
  end;
end $$;

-- Check 4: cancelling restores stock exactly once, and invalid moves are rejected.
-- Uses the newest pending/confirmed/processing order, then rolls everything back.
do $$
declare
  v_admin uuid := (select id from auth.users where email = 'ADMIN_EMAIL');
  v_order uuid := (
    select id from public.orders
    where status in ('pending', 'confirmed', 'processing') and stock_restored_at is null
    order by created_at desc limit 1
  );
  v_before jsonb;
  v_after_cancel jsonb;
  v_expected jsonb;
  v_second_error text;
  v_restored_at timestamptz;
  v_bad_move_error text;
begin
  if v_order is null then
    raise exception 'FAIL: need an order in pending/confirmed/processing to test cancelling';
  end if;

  select jsonb_object_agg(p.id, p.stock_quantity) into v_before
  from public.products p
  where p.id in (select product_id from public.order_items where order_id = v_order);

  select jsonb_object_agg(p.id, p.stock_quantity + q.qty) into v_expected
  from public.products p
  join (select product_id, sum(quantity) as qty from public.order_items
        where order_id = v_order group by product_id) q on q.product_id = p.id;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  begin  -- everything in this block is rolled back at the end
    set local role authenticated;

    -- An invalid move is rejected (pending/confirmed/processing cannot go straight to delivered).
    begin
      perform public.admin_update_order_status(v_order, 'delivered');
    exception when invalid_parameter_value then
      v_bad_move_error := sqlerrm;
    end;

    perform public.admin_update_order_status(v_order, 'cancelled');

    select jsonb_object_agg(p.id, p.stock_quantity) into v_after_cancel
    from public.products p
    where p.id in (select product_id from public.order_items where order_id = v_order);

    -- Second cancel must fail and must not restore stock again.
    begin
      perform public.admin_update_order_status(v_order, 'cancelled');
    exception when invalid_parameter_value then
      v_second_error := sqlerrm;
    end;

    select stock_restored_at into v_restored_at from public.orders where id = v_order;
    if v_after_cancel is distinct from (
      select jsonb_object_agg(p.id, p.stock_quantity) from public.products p
      where p.id in (select product_id from public.order_items where order_id = v_order)
    ) then
      v_second_error := 'STOCK CHANGED ON SECOND CANCEL';
    end if;

    reset role;
    raise exception using errcode = 'BLV00', message = 'undo test changes';
  exception when sqlstate 'BLV00' then
    reset role;  -- rolled back
  end;

  if v_bad_move_error is null then
    raise exception 'FAIL: moving straight to delivered was not rejected';
  end if;
  if v_after_cancel is distinct from v_expected then
    raise exception 'FAIL: stock after cancel % expected % (before %)', v_after_cancel, v_expected, v_before;
  end if;
  if v_second_error is null or v_second_error = 'STOCK CHANGED ON SECOND CANCEL' then
    raise exception 'FAIL: second cancel: %', coalesce(v_second_error, 'was allowed');
  end if;
  if v_restored_at is null then
    raise exception 'FAIL: stock_restored_at was not set';
  end if;
  if v_before is distinct from (
    select jsonb_object_agg(p.id, p.stock_quantity) from public.products p
    where p.id in (select product_id from public.order_items where order_id = v_order)
  ) then
    raise exception 'FAIL: stock was not rolled back after the test';
  end if;
end $$;

select check_name, 'PASS' as result
from (values
  ('1. admin sees all orders and items'),
  ('2. customer sees only own orders and items'),
  ('3. customer and anon cannot change status'),
  ('4. cancel restores stock once; invalid moves rejected')
) as checks(check_name);

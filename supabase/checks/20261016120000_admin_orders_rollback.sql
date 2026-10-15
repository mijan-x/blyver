-- Rollback for migration 20261016120000_admin_orders.sql.
-- Only run this if you need to undo Phase 2A.
--
-- What it does NOT undo: status changes and stock restores already made through
-- admin_update_order_status stay as they are (cancelled orders stay cancelled,
-- restored stock stays restored). The stock_restored_at timestamps are lost.

begin;

drop function if exists public.admin_update_order_status(uuid, public.order_status);

drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Admins can view all order items" on public.order_items;
drop policy if exists "Admins can view all coupon usages" on public.coupon_usages;

drop index if exists public.orders_created_at_idx;
drop index if exists public.orders_status_created_at_idx;
drop index if exists public.orders_user_created_at_idx;
drop index if exists public.order_items_order_idx;
drop index if exists public.order_items_product_idx;

alter table public.orders drop column if exists stock_restored_at;

commit;

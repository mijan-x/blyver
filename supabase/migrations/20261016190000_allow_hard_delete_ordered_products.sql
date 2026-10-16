-- Let admins truly delete a product even if it has past order history.
--
-- order_items already stores its own snapshot of everything an order
-- display needs (product_name, sku, unit_price, quantity, line_total) --
-- it never needs to join back to products to render past orders. The
-- only thing product_id was used for besides the join itself was
-- admin_update_order_status's stock-restore loop, which already updates
-- products by id and is a safe no-op if that id no longer exists.
--
-- Previously product_id had a plain (no action) foreign key, so deleting
-- a product that had ever been ordered was blocked outright; the admin
-- UI/service worked around that by archiving (hiding) the product
-- instead of deleting it, which is correct but means a "deleted" product
-- just sits in the admin list forever marked inactive -- confusing, and
-- not what "delete" should mean for test/mistaken products.
--
-- This makes product_id nullable and ON DELETE SET NULL, so deleting a
-- product detaches it from any past order_items (their own stored
-- fields keep showing correctly) instead of being blocked. Safe to
-- re-run.

alter table public.order_items alter column product_id drop not null;

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

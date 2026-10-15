-- Rollback for migration 20261016150000_lock_review_moderation_fields.sql.
-- Removes the guard trigger, restoring the previous (vulnerable) behavior
-- where a customer's own update to their review can also change `visible`,
-- `product_id` and `user_id`.

begin;

drop trigger if exists reviews_guard_customer_update on public.reviews;
drop function if exists public.reviews_guard_customer_update();

commit;

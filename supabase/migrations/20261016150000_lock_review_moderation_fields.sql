-- Reviews RLS gap: "Users edit their own reviews" restricts which *rows* a
-- customer can update (their own) but not which *columns*. That meant a
-- customer could update their own review's `visible` flag directly, undoing
-- an admin's moderation decision, and could also repoint their review at a
-- different product_id (or user_id) via the same update call. Column
-- privileges aren't expressible in a plain USING/WITH CHECK clause, so this
-- is enforced with a BEFORE UPDATE trigger that resets those fields back to
-- their stored value whenever the caller isn't an admin.
--
-- Safe to re-run: the function and trigger are both replaced/dropped first.

create or replace function public.reviews_guard_customer_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.visible := old.visible;
    new.product_id := old.product_id;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_guard_customer_update on public.reviews;
create trigger reviews_guard_customer_update
  before update on public.reviews
  for each row
  execute function public.reviews_guard_customer_update();

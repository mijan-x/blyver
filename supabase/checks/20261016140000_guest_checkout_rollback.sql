-- Rollback for migration 20261016140000_guest_checkout.sql.
-- Turns guest checkout off. If guest orders already exist (user_id is null),
-- they are kept and user_id stays nullable; the script tells you so.

begin;

drop function if exists public.create_guest_cod_order(jsonb, jsonb, text);
drop function if exists public.normalize_bd_phone(text);
drop index if exists public.orders_guest_phone_open_idx;
alter table public.orders drop column if exists guest_phone;

do $$
begin
  if exists (select 1 from public.orders where user_id is null)
     or exists (select 1 from public.coupon_usages where user_id is null) then
    raise notice 'Guest orders exist, so orders.user_id and coupon_usages.user_id stay nullable.';
  else
    alter table public.orders alter column user_id set not null;
    alter table public.coupon_usages alter column user_id set not null;
  end if;
end $$;

commit;

-- Drops the superseded single-argument create_cod_order(jsonb) overload.
--
-- It was the original checkout function (migration 20260901140000), before
-- coupons were added in 20260901150000 via create_cod_order(jsonb, text).
-- That migration added the new overload with `create or replace` but never
-- dropped the old one, so both have coexisted ever since. The frontend
-- (src/services/checkoutService.ts) has only ever called the two-argument
-- version by name, so the old one has been reachable only by calling the
-- RPC directly, where it would always charge full delivery (no coupon, no
-- free-delivery threshold) instead of the current checkout rules.
--
-- Safe to re-run: `if exists` makes this a no-op once applied.

drop function if exists public.create_cod_order(jsonb);

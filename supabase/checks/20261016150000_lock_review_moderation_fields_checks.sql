-- Checks for migration 20261016150000_lock_review_moderation_fields.sql.
-- Run on a DEVELOPMENT project in the Supabase SQL editor.
--
-- Before running, replace the two emails below:
--   ADMIN_EMAIL    = an account with role 'admin' in public.user_roles
--   CUSTOMER_EMAIL = any normal customer account (doesn't need an order --
--                     this test inserts its own review and product directly,
--                     bypassing the "delivered customer" insert check, since
--                     that check isn't what's being tested here)
--
-- Everything the check creates (a throwaway product and review) is rolled
-- back at the end, so this leaves no data changed.

do $$
declare
  v_admin uuid := (select id from auth.users where email = 'ADMIN_EMAIL');
  v_customer uuid := (select id from auth.users where email = 'CUSTOMER_EMAIL');
  v_product1 uuid := (select id from public.products limit 1);
  v_category uuid := (select category_id from public.products limit 1);
  v_product2 uuid;
  v_review uuid;
  v_visible boolean;
  v_product_id uuid;
  v_user_id uuid;
  v_title text;
  v_err text;
begin
  if v_admin is null then raise exception 'FAIL: ADMIN_EMAIL not found in auth.users'; end if;
  if v_customer is null then raise exception 'FAIL: CUSTOMER_EMAIL not found in auth.users'; end if;
  if not exists (select 1 from public.user_roles where user_id = v_admin and role = 'admin') then
    raise exception 'FAIL: ADMIN_EMAIL does not have the admin role';
  end if;
  if v_product1 is null then raise exception 'FAIL: need at least one product to test with'; end if;

  insert into public.products (category_id, name, slug, sku, gender, original_price, status)
  values (v_category, 'TEST product 2', 'test-product-2-' || gen_random_uuid(), 'TESTSKU2', 'unisex', 100, 'active')
  returning id into v_product2;

  -- Start the review hidden, as if an admin had just moderated it away.
  insert into public.reviews (user_id, product_id, rating, title, body, visible)
  values (v_customer, v_product1, 4, 'Original title', 'Original body', false)
  returning id into v_review;

  perform set_config('request.jwt.claims', json_build_object('sub', v_customer, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- One update that tries to un-hide the review, repoint it at a different
  -- product and a different user, and also change a benign field.
  update public.reviews
  set visible = true, product_id = v_product2, user_id = v_admin, title = 'Edited title'
  where id = v_review;

  reset role;

  select visible, product_id, user_id, title into v_visible, v_product_id, v_user_id, v_title
  from public.reviews where id = v_review;

  if v_visible is distinct from false then
    v_err := coalesce(v_err || '; ', '') || 'FAIL: customer was able to un-hide their review';
  end if;
  if v_product_id is distinct from v_product1 then
    v_err := coalesce(v_err || '; ', '') || 'FAIL: customer was able to repoint product_id';
  end if;
  if v_user_id is distinct from v_customer then
    v_err := coalesce(v_err || '; ', '') || 'FAIL: customer was able to repoint user_id';
  end if;
  if v_title is distinct from 'Edited title' then
    v_err := coalesce(v_err || '; ', '') || 'FAIL: benign field (title) edit was blocked too';
  end if;

  -- An admin can still change visible — the existing moderation flow is untouched.
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.reviews set visible = true where id = v_review;
  reset role;

  select visible into v_visible from public.reviews where id = v_review;
  if v_visible is distinct from true then
    v_err := coalesce(v_err || '; ', '') || 'FAIL: admin could not change visible';
  end if;

  -- Clean up (this all happens before any wrapping transaction commits, but
  -- delete explicitly too in case this is ever run outside one).
  delete from public.reviews where id = v_review;
  delete from public.products where id = v_product2;

  if v_err is not null then
    raise exception '%', v_err;
  end if;
end $$;

select 'review moderation fields are locked down' as check_name, 'PASS' as result;

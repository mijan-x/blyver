# Blyver — Project State

E-commerce storefront for premium watches, wallets and purses (Bangladesh).
Stack: Vite + React 19 + TypeScript + Tailwind v4 + React Router 7 + Supabase, deployed on Vercel from GitHub.

## Folder map

```
index.html              App shell, favicon link
vercel.json             SPA rewrite: all routes -> /index.html
public/                 Static files (favicon.png, favicon.svg, robots.txt, sitemap.xml)
src/
  App.tsx               Router; HomePage eager, all other pages lazy-loaded
  assets/brand/         Logo (full + 128px small), landing cover (png + webp)
  assets/collections/   Collection images (original jpg + optimised webp)
  components/           auth, catalog, layout (SiteHeader etc.), product (ProductCard), seo, system, ui
  features/auth/        RequireAuth, RequireAdmin, useAuth
  hooks/                useCatalogProducts and other data hooks
  layouts/              PublicLayout
  lib/                  Supabase client
  pages/                Route pages (public, account, checkout, admin)
  services/             Supabase data access (catalog, cart, wishlist, ...)
  types/                Shared TypeScript types
  utils/                Helpers (currency formatting, ...)
supabase/
  migrations/           SQL migrations (catalog, profiles, wishlists, carts, orders, coupons, reviews, homepage content, settings, addresses, admin orders)
  checks/               Verification and rollback SQL for migrations (run by hand in the SQL editor; not migrations)
  seeds/                Seed data
```

## Phase checklist

- [x] Phase 0 — Review/audit and Prettier formatting merged to main
- [x] Phase 1 — Speed pass (branch `perf/phase-1`)
  - [x] Compressed images (webp hero/collections, 128px logo)
  - [x] width/height, fetchPriority, lazy/async on images
  - [x] Lightweight catalog list query (no description/variants/specs/collections, first image only, limit 24)
  - [x] Read-only cart badge count
  - [x] vercel.json SPA rewrite
  - [x] Favicon fixed
  - [x] Lazy-loaded routes (except HomePage)
- [x] Phase 2A — Admin orders: database + security (branch `feat/admin-orders-db`)
  - [x] Migration `20261016120000_admin_orders.sql` written and tested on a local Postgres 16
  - [x] Admins can read all `orders`, `order_items`, `coupon_usages` (read-only policies)
  - [x] `admin_update_order_status(order_id, new_status)`: admin-only, validated transitions, stock restored once
  - [x] `orders.stock_restored_at` guard column
  - [x] Indexes: orders (created_at), (status, created_at), (user_id, created_at); order_items (order_id), (product_id)
  - [x] Checks + rollback SQL in `supabase/checks/`
  - [x] Applied to the live Supabase project `blyver` (2026-10-16, via SQL editor) and verified read-only
- [x] Phase 2A.1 — Bug fixes (branch `fix/checkout-and-settings`, on top of 2A)
  - [x] Migration `20261016130000_fix_checkout_and_site_settings.sql` written and tested locally
  - [x] `create_cod_order`: orders without a coupon work again (coupon id/code kept in plain variables)
  - [x] `site_settings`: RLS enabled, public read, admin-only write
  - [x] Applied to the live Supabase project `blyver` (2026-10-16, via SQL editor) and verified read-only
- [x] Phase 2C — Guest checkout (merged to `main` via `feat/guest-checkout`, on top of 2A.1)
  - [x] Migration `20261016140000_guest_checkout.sql` written and tested locally
  - [x] `create_guest_cod_order(customer_address, items, coupon_code_input)` callable without login
  - [x] Guest cart in browser storage; merges into the account cart on sign-in
  - [x] Cart, checkout and order-success pages open to guests
  - [x] Applied to the live Supabase project by Claude via the Supabase connector (migrations `guest_checkout_function` + `guest_checkout_nullable_user`) and verified with a rolled-back test order
  - [x] Vercel preview build passes (`tsc -b && vite build`)
  - [x] Smoke-tested in the browser (add to bag, badge, checkout form shown as guest) — no real order placed yet
  - [x] A real guest order placed and confirmed end-to-end on production (2026-10-16, order `BLV-20261015-68D166`: placed via the browser on blyver.vercel.app as a signed-out guest, verified in the database — `user_id` null, `guest_phone` set, correct item/price/total — then cancelled through `admin_update_order_status` impersonating the admin role, which restored stock as expected; cancelled afterward so it doesn't sit in the live orders queue as a fake pending order)
- [x] Phase 2B — Admin orders page (merged to `main` via `feat/admin-orders-page`, on top of 2A)
  - [x] `/admin/orders`: list every order (newest first), filter by status, search by order number/name/phone
  - [x] Expand an order to see items, delivery address, coupon and totals
  - [x] Change status through buttons that only show the transitions `admin_update_order_status` allows
  - [x] Linked from the admin dashboard ("Total orders" tile and a new Orders card)
- [x] Phase 2B.1 — Admin dashboard was unreachable from the signed-in UI (merged to `main` via `fix/admin-nav-link`)
  - [x] `useIsAdmin()` hook (same role check as `RequireAdmin`)
  - [x] `/account` shows a "Store dashboard" card to admins, linking to `/admin`
  - [x] Header utility nav shows an "Admin" link to admins, desktop and mobile

### Guest checkout rules (enforced by `create_guest_cod_order`)

- Valid Bangladesh mobile required (`01[3-9]XXXXXXXX`; `+880`/`880` and spaces/dashes accepted, stored as `01XXXXXXXXX` in `orders.guest_phone`).
- 1–10 of each product, max 20 different products per order; duplicate lines are summed.
- Max 3 open (`pending`/`confirmed`) guest orders per mobile number; an advisory lock makes simultaneous orders from one number wait for each other.
- Prices, stock, coupon and delivery charge come from the database only.
- Coupon per-customer limit for guests is counted by mobile number (across guest and logged-in orders with that phone).
- Guest orders have `user_id = null`. Guests cannot read orders afterwards; admins see them like any order. Email is optional for guests.
- Known gap: a logged-in user's coupon limit (old `create_cod_order`) counts by account only, so a coupon used once as a guest can be used once more after signing up.

### Order status transitions (enforced by `admin_update_order_status`)

| From             | Allowed to                            |
| ---------------- | ------------------------------------- |
| pending          | confirmed, cancelled                  |
| confirmed        | processing, cancelled                 |
| processing       | shipped, cancelled                    |
| shipped          | out_for_delivery, delivered, returned |
| out_for_delivery | delivered, returned                   |
| delivered        | returned                              |
| cancelled        | — (final)                             |
| returned         | — (final)                             |

- Same-status changes are rejected (a double click gets an error, not a second update).
- Moving to `cancelled` or `returned` adds every order item's quantity back to `products.stock_quantity` and sets `orders.stock_restored_at`. If that column is already set, stock is not restored again.
- Returned items go straight back into sellable stock. If damaged returns become common, add a "restock?" flag later.
- The order row is locked while updating, so two admins cancelling at once restore stock only once (tested).
- Admins have no direct UPDATE/DELETE on orders; all status changes go through the function.

## Known bugs

- ~~Admin cannot see all orders~~ — fixed (Phase 2A, live).
- ~~`create_cod_order` fails for every order without a coupon~~ (`record "v_coupon" is not assigned yet`) — fixed (Phase 2A.1, live).
- ~~`site_settings` has RLS disabled~~ (anyone with the anon key could change delivery charge, phone, WhatsApp) — fixed (Phase 2A.1, live).
- An old one-argument `create_cod_order(jsonb)` overload (no coupons, no free delivery) still exists alongside the current two-argument version.
- Removing an ordered product fails (foreign key constraint).
- Search, About and Contact pages are placeholders.
- Category chips are not clickable.
- Variants exist in the database but are unused by the UI.

## Notes

- `getCatalogProducts` now returns at most 24 products and omits description, variants, specifications and collection ids. Use `getProductBySlug` for full product data.
- `wishlistService` calls `getCatalogProducts()` and filters client-side, so wishlists can miss items beyond the first 24 products. Fix by fetching wishlist products by id.
- Supabase: there is only one project (`blyver`, ref `ckogspznzsatqjothmxm`), and it is live. No separate dev project yet. Migrations are applied by hand in the SQL editor, so `supabase_migrations` history is empty.
- Only admin: `blyver.admin@gmail.com`. New sign-ups get the `customer` role automatically; only an admin can change roles.
- ~~Open security gap: customers can edit their own reviews' `visible` flag (could un-hide a review an admin hid)~~ — fixed (migration `20261016150000_lock_review_moderation_fields.sql`, live). A `before update` trigger resets `visible`, `product_id` and `user_id` back to their stored value for non-admins, since a plain RLS `using`/`with check` clause can only restrict which rows a customer can touch, not which columns. Verified live with a rolled-back test: a customer's update can no longer change those three fields (even mixed into the same statement as a benign field edit, which still goes through), and an admin's own moderation updates are unaffected.
- Supabase connector: Claude can apply migrations directly, but the connector silently cancels any SQL it sees as destructive (`DROP POLICY`, `TRUNCATE`, etc.) because its confirmation prompt can't be shown here. `DROP NOT NULL` and plain `CREATE`/`ALTER`/`COMMENT` go through. Keep migrations free of those statements, or split them out and run the destructive part in the SQL editor.

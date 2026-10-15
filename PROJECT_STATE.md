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
  migrations/           SQL migrations (catalog, profiles, wishlists, carts, orders, coupons, reviews, homepage content, settings, addresses)
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
- [ ] Phase 2 — not started

## Known bugs

- Admin cannot see all orders (no admin RLS policy on `orders`).
- Removing an ordered product fails (foreign key constraint).
- Search, About and Contact pages are placeholders.
- Category chips are not clickable.
- Variants exist in the database but are unused by the UI.

## Notes

- `getCatalogProducts` now returns at most 24 products and omits description, variants, specifications and collection ids. Use `getProductBySlug` for full product data.
- `wishlistService` calls `getCatalogProducts()` and filters client-side, so wishlists can miss items beyond the first 24 products. Fix by fetching wishlist products by id.

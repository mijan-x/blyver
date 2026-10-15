-- Admin-editable "collection feature image" support.
--
-- /collections (and nothing else) was rendering four hardcoded entries
-- baked into src/pages/CollectionsPage.tsx -- names, descriptions, and
-- images all in source code, with no admin control and no connection to
-- the `collections` table at all (which already existed, with
-- name/slug/description/image_path/position/active, but was completely
-- unused by the frontend).
--
-- This adds the one missing piece -- a link target per collection, since
-- the table had no gender/category to derive a "Discover" link from --
-- and seeds the table with the four collections that were previously
-- hardcoded, so the public page's content stays the same immediately
-- after this ships. image_path is left null on the seed rows: this
-- migration can't upload the actual image files (no file access from a
-- SQL migration), so the frontend falls back to the same bundled images
-- it already uses for these specific known slugs until an admin uploads
-- a replacement via /admin/collections, which is the actual feature this
-- migration exists for -- letting admins change the image (and
-- everything else about a collection) without a code change.
--
-- Safe to re-run: add column if not exists, insert ... on conflict do nothing.

alter table public.collections add column if not exists link_path text;

insert into public.collections (name, slug, description, link_path, position, active)
values
  ('Men''s Watches', 'mens-watches', 'Refined timepieces for every defining moment.', '/men', 1, true),
  ('Women''s Watches', 'womens-watches', 'Elegant details, designed to be worn every day.', '/women', 2, true),
  ('Wallets', 'wallets', 'Modern leather essentials with lasting character.', '/men', 3, true),
  ('Ladies'' Purses', 'ladies-purses', 'Sophisticated companions for life in motion.', '/women', 4, true)
on conflict (slug) do nothing;

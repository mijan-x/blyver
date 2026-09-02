-- Blyver product: POEDAGAR 613 men's watch.
-- Safe to run again: it updates only the product with SKU 14EA3.

insert into public.categories (name, slug, gender, description, active)
values ('Men''s Watches', 'mens-watches', 'men', 'Refined timepieces for every defining moment.', true)
on conflict (slug) do update
set name = excluded.name, gender = excluded.gender, active = excluded.active;

insert into public.products (
  category_id,
  name,
  slug,
  sku,
  short_description,
  description,
  gender,
  original_price,
  sale_price,
  stock_quantity,
  low_stock_threshold,
  featured,
  new_arrival,
  best_seller,
  status
)
select
  categories.id,
  'Poedagar 613 Business Quartz Luxury Stainless Steel Watch for Men',
  'poedagar-613-business-quartz-luxury-stainless-steel-watch',
  '14EA3',
  'Business quartz watch with a square stainless-steel case, luminous hands, calendar display, and a polished hidden clasp.',
  E'Case Thickness: 10mm\n\nBand Width: 20mm\nBand Material: Stainless Steel\nCase Shape: Square\nDial Window Material: Hardlex\nBoxes & Cases Material: Paper\nModel Number: 613\nDial Diameter: 40mm\nFeatures: Luminous hands, auto date, complete calendar, water resistant\nWater Resistance: 3Bar\nClasp Type: Push Button Hidden Clasp\nBand Length: 20cm\nCase Material: Stainless Steel\nMovement: Quartz\nStyle: Fashion & Casual\nBrand: POEDAGAR\nOrigin: Mainland China\nCertification: CE\nItem Type: Quartz Wristwatch',
  'men',
  1500,
  990,
  5,
  3,
  true,
  true,
  true,
  'active'
from public.categories
where categories.slug = 'mens-watches'
on conflict (sku) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  slug = excluded.slug,
  short_description = excluded.short_description,
  description = excluded.description,
  gender = excluded.gender,
  original_price = excluded.original_price,
  sale_price = excluded.sale_price,
  stock_quantity = excluded.stock_quantity,
  low_stock_threshold = excluded.low_stock_threshold,
  featured = excluded.featured,
  new_arrival = excluded.new_arrival,
  best_seller = excluded.best_seller,
  status = excluded.status;

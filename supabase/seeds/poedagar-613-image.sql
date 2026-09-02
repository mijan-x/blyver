-- Run this after uploading the photo to the product-images bucket at:
-- products/poedagar-613/main.jpeg

insert into public.product_images (product_id, storage_path, alt_text, position)
select
  products.id,
  'products/poedagar-613/main.jpeg',
  'POEDAGAR 613 stainless steel watch with green dial',
  0
from public.products
where products.sku = '14EA3'
on conflict (product_id, position) do update
set
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text;

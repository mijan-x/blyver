-- Blyver catalogue foundation: products, related data, image storage, and access policies.
-- Apply this file through the Supabase SQL Editor before connecting live catalogue queries.

create extension if not exists pgcrypto;

create type public.product_gender as enum ('men', 'women', 'unisex');
create type public.product_status as enum ('active', 'inactive');
create type public.user_role as enum ('admin', 'customer');

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  gender public.product_gender,
  description text,
  image_path text,
  position integer not null default 0 check (position >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  position integer not null default 0 check (position >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  short_description text not null default '',
  description text not null default '',
  gender public.product_gender not null,
  original_price numeric(12, 2) not null check (original_price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or (sale_price >= 0 and sale_price <= original_price)),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  featured boolean not null default false,
  new_arrival boolean not null default false,
  best_seller boolean not null default false,
  status public.product_status not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_collections (
  product_id uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, collection_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  option_values jsonb not null default '{}'::jsonb,
  price_adjustment numeric(12, 2) not null default 0,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  position integer not null default 0 check (position >= 0),
  unique (product_id, label)
);

create index products_catalog_idx on public.products (gender, status, category_id, created_at desc);
create index products_featured_idx on public.products (featured, status) where featured;
create index product_collections_collection_idx on public.product_collections (collection_id, product_id);
create index product_images_product_idx on public.product_images (product_id, position);
create index product_variants_product_idx on public.product_variants (product_id);
create index product_specifications_product_idx on public.product_specifications (product_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger collections_set_updated_at before update on public.collections for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();

alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_specifications enable row level security;

create policy "Users can view their own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

create policy "Public can view active categories" on public.categories for select using (active or public.is_admin());
create policy "Public can view active collections" on public.collections for select using (active or public.is_admin());
create policy "Public can view active products" on public.products for select using (status = 'active' or public.is_admin());
create policy "Public can view active product collections" on public.product_collections for select using (exists (select 1 from public.products where products.id = product_id and (products.status = 'active' or public.is_admin())));
create policy "Public can view active product images" on public.product_images for select using (exists (select 1 from public.products where products.id = product_id and (products.status = 'active' or public.is_admin())));
create policy "Public can view active product variants" on public.product_variants for select using (active and exists (select 1 from public.products where products.id = product_id and (products.status = 'active' or public.is_admin())));
create policy "Public can view active product specifications" on public.product_specifications for select using (exists (select 1 from public.products where products.id = product_id and (products.status = 'active' or public.is_admin())));

create policy "Admins can manage roles" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage collections" on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product collections" on public.product_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product specifications" on public.product_specifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can view product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admins can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

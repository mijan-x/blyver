create table public.wishlists (user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), primary key (user_id, product_id));
alter table public.wishlists enable row level security;
create policy "Users can view their own wishlist" on public.wishlists for select to authenticated using (user_id = auth.uid());
create policy "Users can add their own wishlist items" on public.wishlists for insert to authenticated with check (user_id = auth.uid());
create policy "Users can remove their own wishlist items" on public.wishlists for delete to authenticated using (user_id = auth.uid());

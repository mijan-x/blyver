-- Customer delivery address book.
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  division text not null,
  district text not null,
  area text not null,
  full_address text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id, is_default desc, created_at desc);
create trigger addresses_set_updated_at before update on public.addresses for each row execute function public.set_updated_at();
alter table public.addresses enable row level security;
create policy "Users manage their own addresses" on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

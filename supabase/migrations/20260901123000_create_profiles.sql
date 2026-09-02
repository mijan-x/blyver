create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text not null default '', phone text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, full_name, phone) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'phone', '')); insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict (user_id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users can update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins can manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

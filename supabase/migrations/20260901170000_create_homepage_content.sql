create table public.homepage_content (id boolean primary key default true check (id), content jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
insert into public.homepage_content (id) values (true) on conflict (id) do nothing;
create trigger homepage_content_set_updated_at before update on public.homepage_content for each row execute function public.set_updated_at();
alter table public.homepage_content enable row level security;
create policy "Public can read homepage content" on public.homepage_content for select using (true);
create policy "Admins manage homepage content" on public.homepage_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

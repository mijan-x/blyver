-- Newsletter sign-ups from the homepage "Join the Blyver list" form.
--
-- Anyone (signed in or not) can add their email; nobody but admins can read
-- the list. The form uses insert ... on conflict do nothing, so a repeat
-- sign-up succeeds silently and never reveals whether an email is already
-- on the list.
--
-- Not re-runnable as-is (create policy has no "if not exists"); see the
-- rollback in supabase/checks/ to undo it first.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_format
    check (
      length(email) <= 254
      and email = lower(btrim(email))
      and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    )
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can join the newsletter"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

create policy "Admins read newsletter subscribers"
  on public.newsletter_subscribers
  for select
  to authenticated
  using (public.is_admin());

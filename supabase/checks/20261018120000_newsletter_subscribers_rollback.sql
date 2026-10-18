-- Rollback for 20261018120000_newsletter_subscribers.sql (run by hand in the
-- SQL editor). This deletes every collected email address.
drop table if exists public.newsletter_subscribers;

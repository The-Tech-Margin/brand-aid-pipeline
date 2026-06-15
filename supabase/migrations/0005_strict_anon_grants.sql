-- Least-privilege hardening for the brand_helper schema.
--
-- The app never touches brand_helper data with the anon role: auth flows use the
-- `auth` schema, the login rate-limiter uses the service role, and all user data is
-- read/written only after sign-in (the `authenticated` role, row-confined by the
-- per-owner RLS policies in 0001/0003) or by the service role (the pipeline). So
-- `anon` should have no table access at all — RLS already denies it row-by-row, but
-- this removes the GRANT so RLS isn't the only barrier (mirrors the members
-- hardening in 0003). `authenticated` and `service_role` are unaffected.

revoke all on all tables in schema brand_helper from anon;

-- 0001 set default privileges granting anon ALL on new tables — undo that so future
-- tables in this schema don't silently re-open anon access.
alter default privileges in schema brand_helper revoke all on tables from anon;

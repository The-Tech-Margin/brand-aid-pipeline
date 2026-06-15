-- Expose `brand_helper` on the PostgREST API so the app's anon-key reads and the
-- schema-pull tooling can reach it. Migrations 0001-0003 create the tables but do
-- NOT change the API allowlist — that lives in `pgrst.db_schemas` on the
-- `authenticator` role.
--
-- IMPORTANT: `pgrst.db_schemas` is a single, GLOBAL, last-writer-wins setting
-- shared by every app in this Supabase project. Setting it to a stale literal would
-- silently drop the other portfolio schemas (public, talk) off the API. So we read
-- the live value and append `brand_helper` only if it's missing — idempotent, and
-- never clobbers another app's schema. This migration is the canonical owner of the
-- allowlist: any schema added by any app must also be appended here.
--
-- Must run as a privileged role that can ALTER ROLE authenticator (the role used by
-- `supabase db push` / the SQL editor on Supabase qualifies).

do $$
declare
  current_list text;
begin
  select split_part(cfg, '=', 2)
    into current_list
    from unnest(coalesce((select rolconfig from pg_roles where rolname = 'authenticator'),
                         array[]::text[])) as cfg
   where cfg like 'pgrst.db_schemas=%'
   limit 1;

  current_list := coalesce(current_list, 'public, graphql_public');

  if position('brand_helper' in current_list) = 0 then
    execute format('alter role authenticator set pgrst.db_schemas = %L',
                   current_list || ', brand_helper');
  end if;
end $$;

-- Hot-reload PostgREST's config (no restart).
notify pgrst, 'reload config';

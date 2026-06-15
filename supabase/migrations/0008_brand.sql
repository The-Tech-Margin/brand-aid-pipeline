-- Per-user brand identity (business name + logo), with an admin-set global default.
-- Mirrors the theme model: a member's own brand overrides the admin global, which
-- overrides the app's built-in default. The global brand reuses brand_helper.app_settings
-- (key 'global_brand', admin-write via the existing app_settings policies, 0007).
--
-- The logo is a path into the existing private storage bucket (an uploaded input asset);
-- it's served only via short-lived signed URLs, never a public path.

create table if not exists brand_helper.brand_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  business_name text,
  logo_path text,
  updated_at timestamptz not null default now()
);

alter table brand_helper.brand_profiles enable row level security;

-- Owner-only, like brand_helper.themes: no anon; authenticated members CRUD their own row.
revoke all on brand_helper.brand_profiles from anon;
grant select, insert, update, delete on brand_helper.brand_profiles to authenticated;

create policy brand_profiles_owner on brand_helper.brand_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

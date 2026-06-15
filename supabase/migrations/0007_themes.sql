-- Admin-set, app-wide default theme.
--
-- Per-user custom themes already live in brand_helper.themes (0001, owner-only RLS:
-- the themes_owner policy + authenticated CRUD grant let each member create, edit,
-- and delete only their own themes). This migration adds the one thing missing for
-- "admin can set a theme globally": a single app-wide default every member receives
-- until they pick their own. It's stored as a key/value setting so the mechanism
-- generalizes to future app-wide settings rather than hard-coding a themes column.

create table if not exists brand_helper.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table brand_helper.app_settings enable row level security;

-- Least privilege: no anon access (0005 already revokes the schema-wide anon default,
-- but be explicit). authenticated gets the CRUD verbs; the RLS policies below confine
-- them — reads to active members, writes to admins.
revoke all on brand_helper.app_settings from anon;
grant select, insert, update, delete on brand_helper.app_settings to authenticated;

-- Every active member may read settings (to receive the global default theme).
create policy app_settings_member_read on brand_helper.app_settings
  for select using (brand_helper.is_active_member());

-- Only admins may create/update/delete settings (e.g. set or clear the global theme).
create policy app_settings_admin_write on brand_helper.app_settings
  for all using (brand_helper.is_admin()) with check (brand_helper.is_admin());

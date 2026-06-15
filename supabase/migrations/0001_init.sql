-- Brand Helper schema. Lives in a dedicated `brand_helper` schema inside the
-- shared portfolio project so it never collides with other apps' tables.
-- Expose `brand_helper` in Project Settings > API > Exposed schemas after running.

create schema if not exists brand_helper;

grant usage on schema brand_helper to anon, authenticated, service_role;
alter default privileges in schema brand_helper
  grant all on tables to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists brand_helper.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  region text not null,
  audience text not null,
  message text not null,
  locale text,
  status text not null default 'draft',
  brand_palette jsonb,
  created_at timestamptz not null default now()
);

create table if not exists brand_helper.products (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references brand_helper.campaigns (id) on delete cascade,
  name text not null,
  description text not null,
  slug text not null,
  input_assets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists brand_helper.assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references brand_helper.campaigns (id) on delete cascade,
  product_id uuid references brand_helper.products (id) on delete cascade,
  kind text not null check (kind in ('input', 'hero', 'creative')),
  aspect_ratio text,
  storage_path text not null,
  source text check (source in ('reused', 'generated')),
  variant text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create table if not exists brand_helper.runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references brand_helper.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed')),
  totals jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists brand_helper.run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references brand_helper.runs (id) on delete cascade,
  level text not null default 'info' check (level in ('debug', 'info', 'warn', 'error')),
  stage text not null,
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists brand_helper.compliance_results (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references brand_helper.assets (id) on delete cascade,
  check text not null,
  status text not null check (status in ('pass', 'warn', 'fail')),
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists brand_helper.themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  tokens jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_campaign on brand_helper.products (campaign_id);
create index if not exists idx_assets_campaign on brand_helper.assets (campaign_id);
create index if not exists idx_assets_product on brand_helper.assets (product_id);
create index if not exists idx_runs_campaign on brand_helper.runs (campaign_id);
create index if not exists idx_run_events_run on brand_helper.run_events (run_id);
create index if not exists idx_compliance_asset on brand_helper.compliance_results (asset_id);
create index if not exists idx_themes_user on brand_helper.themes (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — every row is owned by a user; children inherit ownership
-- through their parent campaign/run. The service role bypasses RLS for pipeline
-- writes, so these policies guard the user-facing (anon-key) access path.
-- ---------------------------------------------------------------------------

alter table brand_helper.campaigns enable row level security;
alter table brand_helper.products enable row level security;
alter table brand_helper.assets enable row level security;
alter table brand_helper.runs enable row level security;
alter table brand_helper.run_events enable row level security;
alter table brand_helper.compliance_results enable row level security;
alter table brand_helper.themes enable row level security;

create policy campaigns_owner on brand_helper.campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy runs_owner on brand_helper.runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy themes_owner on brand_helper.themes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy products_via_campaign on brand_helper.products
  for all using (
    exists (
      select 1 from brand_helper.campaigns c
      where c.id = products.campaign_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from brand_helper.campaigns c
      where c.id = products.campaign_id and c.user_id = auth.uid()
    )
  );

create policy assets_via_campaign on brand_helper.assets
  for all using (
    exists (
      select 1 from brand_helper.campaigns c
      where c.id = assets.campaign_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from brand_helper.campaigns c
      where c.id = assets.campaign_id and c.user_id = auth.uid()
    )
  );

create policy run_events_via_run on brand_helper.run_events
  for all using (
    exists (
      select 1 from brand_helper.runs r
      where r.id = run_events.run_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from brand_helper.runs r
      where r.id = run_events.run_id and r.user_id = auth.uid()
    )
  );

create policy compliance_via_asset on brand_helper.compliance_results
  for all using (
    exists (
      select 1
      from brand_helper.assets a
      join brand_helper.campaigns c on c.id = a.campaign_id
      where a.id = compliance_results.asset_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from brand_helper.assets a
      join brand_helper.campaigns c on c.id = a.campaign_id
      where a.id = compliance_results.asset_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Private storage bucket for input assets + generated creatives. Served via
-- server-minted signed URLs only (no public policies).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('brand-helper', 'brand-helper', false)
on conflict (id) do nothing;

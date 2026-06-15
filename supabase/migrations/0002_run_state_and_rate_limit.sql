-- Adds resumable run-execution state (so a campaign can run per-product across
-- separate serverless invocations) and a serverless-safe login rate-limit table.
-- Apply after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Run execution state — lets the chunked runner resume mid-campaign.
-- ---------------------------------------------------------------------------
alter table brand_helper.runs
  add column if not exists brief jsonb,
  add column if not exists mode text not null default 'inline'
    check (mode in ('inline', 'chunked')),
  add column if not exists next_product_index int not null default 0;

-- ---------------------------------------------------------------------------
-- Login rate limiting — in-memory counters don't survive serverless cold starts,
-- so attempts are counted here. The key is a salted hash of IP+email; the raw
-- identifiers are never stored (see lib/auth/rate-limit.ts).
-- ---------------------------------------------------------------------------
create table if not exists brand_helper.login_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_key text not null,
  window_start timestamptz not null default now(),
  count int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_key
  on brand_helper.login_attempts (attempt_key, window_start);

-- Written only by the service role (the proxy limiter). No user ever reads it, so
-- enable RLS with no policies — anon/authenticated are denied; service_role bypasses.
alter table brand_helper.login_attempts enable row level security;

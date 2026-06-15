-- Visitor access requests: an UNAUTHENTICATED visitor submits name/organization/email
-- via a server action that writes with the service role (anon has no grants in this
-- schema — 0005), exactly like brand_helper.login_attempts (0002). An admin reviews each
-- request (approve sends a magic-link invite; deny closes it). The captured name/org are
-- copied onto the member row on approval so they're reachable by user_id for record views.

create table if not exists brand_helper.access_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz
);

-- At most one OPEN (pending) request per email — blocks duplicate-pending spam while
-- letting a denied email request again (denied rows don't occupy the slot). Case-insensitive.
create unique index if not exists uq_access_requests_pending_email
  on brand_helper.access_requests (lower(email))
  where status = 'pending';

create index if not exists idx_access_requests_status_created
  on brand_helper.access_requests (status, created_at desc);

-- Least privilege (mirrors members/admin_allowlist): service role writes, admins read for
-- the review UI, anon gets nothing (0005 already revoked it; this is explicit defense).
alter table brand_helper.access_requests enable row level security;
revoke all on brand_helper.access_requests from anon, authenticated;
grant select on brand_helper.access_requests to authenticated;

create policy access_requests_admin_read on brand_helper.access_requests
  for select using (brand_helper.is_admin());

-- ---------------------------------------------------------------------------------------
-- Members: carry the requester's name/organization (reachable by user_id for record
-- views) and allow soft-revoke of a granted visitor.
-- ---------------------------------------------------------------------------------------
alter table brand_helper.members
  add column if not exists full_name text,
  add column if not exists organization text;

-- Extend the status check to include 'revoked'. The 0003 inline check has Postgres's
-- default name; look it up so this is robust across environments.
do $$
declare
  cname text;
begin
  select conname into cname
    from pg_constraint
   where conrelid = 'brand_helper.members'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%status%';
  if cname is not null then
    execute format('alter table brand_helper.members drop constraint %I', cname);
  end if;
  alter table brand_helper.members
    add constraint members_status_check check (status in ('invited', 'active', 'revoked'));
end $$;

-- ---------------------------------------------------------------------------------------
-- Admin-sees-all for record views: admins may read every campaign and run (own-only for
-- visitors stays via campaigns_owner / runs_owner from 0001). Mirrors members_admin_read.
-- ---------------------------------------------------------------------------------------
create policy campaigns_admin_read on brand_helper.campaigns
  for select using (brand_helper.is_admin());

create policy runs_admin_read on brand_helper.runs
  for select using (brand_helper.is_admin());

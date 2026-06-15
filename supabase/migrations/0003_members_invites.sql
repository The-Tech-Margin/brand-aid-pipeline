-- Invite-only membership for Brand Helper.
--
-- Access is granted by inviting an email (admin), which creates the auth user via
-- the service role. Public sign-ups must be DISABLED in Supabase
-- (Authentication > Providers > Email > "Allow new users to sign up" = off), so the
-- only way in is an invite; the app signs in with magic links
-- (shouldCreateUser: false). Each member keeps the existing per-owner RLS — they
-- create/edit only their own campaigns/runs/themes and run the full pipeline.

create table if not exists brand_helper.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid unique references auth.users (id) on delete cascade,
  role text not null default 'visitor' check (role in ('visitor', 'admin')),
  status text not null default 'invited' check (status in ('invited', 'active')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create index if not exists idx_members_email on brand_helper.members (lower(email));
create index if not exists idx_members_user on brand_helper.members (user_id);

-- SECURITY DEFINER helpers — bypass RLS so the members policies can reference the
-- members table without recursing on themselves.
create or replace function brand_helper.is_admin()
returns boolean
language sql
stable
security definer
set search_path = brand_helper
as $$
  select exists (
    select 1 from brand_helper.members m
    where m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'
  );
$$;

create or replace function brand_helper.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = brand_helper
as $$
  select exists (
    select 1 from brand_helper.members m
    where m.user_id = auth.uid() and m.status = 'active'
  );
$$;

grant execute on function brand_helper.is_admin() to authenticated;
grant execute on function brand_helper.is_active_member() to authenticated;

alter table brand_helper.members enable row level security;

-- A member can read their own row (to learn their role/status).
create policy members_self_read on brand_helper.members
  for select using (auth.uid() = user_id);

-- Admins can read every member (for the invite / members UI). All writes
-- (invite, activation) go through the service role, which bypasses RLS.
create policy members_admin_read on brand_helper.members
  for select using (brand_helper.is_admin());

-- Least privilege at the GRANT layer too, so RLS isn't the only barrier: members
-- is written ONLY by the service role (invites + activation). Authenticated users
-- get SELECT (scoped by the policies above); anon gets nothing. (0001's default
-- privileges otherwise hand anon/authenticated ALL on new tables.)
revoke all on brand_helper.members from anon, authenticated;
grant select on brand_helper.members to authenticated;

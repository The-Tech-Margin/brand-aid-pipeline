-- Move admin assignment from the app (ADMIN_EMAILS env var) into the database, so
-- "who is an admin" is data the DB owns and enforces, not config the app interprets.
--
-- Source of truth: brand_helper.admin_allowlist. A BEFORE INSERT/UPDATE trigger on
-- members stamps members.role from that allowlist on every write, so app code can
-- never set the wrong role and the role always mirrors the allowlist (add an email
-- → admin on next sign-in; remove it → demoted on next write).

create table if not exists brand_helper.admin_allowlist (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

-- Least privilege (mirrors members): service role writes; admins may read; anon none.
alter table brand_helper.admin_allowlist enable row level security;
revoke all on brand_helper.admin_allowlist from anon, authenticated;
grant select on brand_helper.admin_allowlist to authenticated;
create policy admin_allowlist_admin_read on brand_helper.admin_allowlist
  for select using (brand_helper.is_admin());

-- Stamp members.role from the allowlist. SECURITY DEFINER so the trigger can always
-- read the allowlist regardless of the writer's privileges.
create or replace function brand_helper.sync_member_role()
returns trigger
language plpgsql
security definer
set search_path = brand_helper
as $$
begin
  new.role := case
    when exists (select 1 from brand_helper.admin_allowlist a where a.email = lower(new.email))
      then 'admin'
    else 'visitor'
  end;
  return new;
end;
$$;

drop trigger if exists members_set_role on brand_helper.members;
create trigger members_set_role
  before insert or update on brand_helper.members
  for each row execute function brand_helper.sync_member_role();

-- Re-sync any rows that predate the trigger.
update brand_helper.members set email = email;

-- Seed the sole admin (lowercase; the trigger compares lower(email)).
insert into brand_helper.admin_allowlist (email, note)
values ('sonia@thetechmargin.com', 'Owner')
on conflict (email) do nothing;

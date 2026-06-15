-- Seed data for local/demo setup. The storage bucket itself is created in the
-- migration. Example input assets are binary files, so they're uploaded by the
-- seed script (`npm run seed`) rather than inlined here — that script generates
-- placeholder product images and uploads them under input-assets/ so reviewers
-- immediately see the reuse-vs-generate decision in action.

insert into storage.buckets (id, name, public)
values ('brand-helper', 'brand-helper', false)
on conflict (id) do nothing;

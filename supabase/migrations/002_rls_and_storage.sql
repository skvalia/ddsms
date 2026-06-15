-- =========================================================
-- DDSMS - Row Level Security & Storage Buckets
-- Phase 1: Simple authenticated-access policy
-- (any logged-in staff member can read/write everything)
-- Tighten further in Phase 2 with role-based policies.
-- =========================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.parties enable row level security;
alter table public.projects enable row level security;
alter table public.inspirations enable row level security;
alter table public.sketches enable row level security;
alter table public.sketch_files enable row level security;
alter table public.dssr enable row level security;
alter table public.dssr_versions enable row level security;
alter table public.dssr_files enable row level security;
alter table public.ssr enable row level security;
alter table public.ssr_files enable row level security;
alter table public.status_history enable row level security;
alter table public.comments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.ai_tags enable row level security;

-- Generic policy: authenticated users can do everything
-- (Applied per table because Postgres has no "for all tables" shortcut)

create policy "auth_all_users" on public.users
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_parties" on public.parties
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_projects" on public.projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_inspirations" on public.inspirations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_sketches" on public.sketches
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_sketch_files" on public.sketch_files
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_dssr" on public.dssr
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_dssr_versions" on public.dssr_versions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_dssr_files" on public.dssr_files
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_ssr" on public.ssr
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_ssr_files" on public.ssr_files
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_status_history" on public.status_history
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_comments" on public.comments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_activity_logs" on public.activity_logs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_ai_tags" on public.ai_tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('inspirations', 'inspirations', true),
  ('sketches', 'sketches', true),
  ('dssr-files', 'dssr-files', true),
  ('ssr-files', 'ssr-files', true)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload/read/delete
create policy "auth_read_inspirations" on storage.objects
  for select using (bucket_id = 'inspirations');
create policy "auth_write_inspirations" on storage.objects
  for insert with check (bucket_id = 'inspirations' and auth.role() = 'authenticated');
create policy "auth_delete_inspirations" on storage.objects
  for delete using (bucket_id = 'inspirations' and auth.role() = 'authenticated');

create policy "auth_read_sketches" on storage.objects
  for select using (bucket_id = 'sketches');
create policy "auth_write_sketches" on storage.objects
  for insert with check (bucket_id = 'sketches' and auth.role() = 'authenticated');
create policy "auth_delete_sketches" on storage.objects
  for delete using (bucket_id = 'sketches' and auth.role() = 'authenticated');

create policy "auth_read_dssr_files" on storage.objects
  for select using (bucket_id = 'dssr-files');
create policy "auth_write_dssr_files" on storage.objects
  for insert with check (bucket_id = 'dssr-files' and auth.role() = 'authenticated');
create policy "auth_delete_dssr_files" on storage.objects
  for delete using (bucket_id = 'dssr-files' and auth.role() = 'authenticated');

create policy "auth_read_ssr_files" on storage.objects
  for select using (bucket_id = 'ssr-files');
create policy "auth_write_ssr_files" on storage.objects
  for insert with check (bucket_id = 'ssr-files' and auth.role() = 'authenticated');
create policy "auth_delete_ssr_files" on storage.objects
  for delete using (bucket_id = 'ssr-files' and auth.role() = 'authenticated');

-- =========================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

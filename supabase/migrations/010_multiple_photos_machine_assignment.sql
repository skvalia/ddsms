-- Point 1: Multiple photos on inspiration
create table if not exists public.inspiration_photos (
  id uuid primary key default uuid_generate_v4(),
  inspiration_id uuid references public.inspirations(id) on delete cascade,
  photo_path text not null,
  caption text,
  sort_order integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.inspiration_photos enable row level security;
drop policy if exists "auth_all_inspiration_photos" on public.inspiration_photos;
create policy "auth_all_inspiration_photos" on public.inspiration_photos
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Point 3: SSR inherits machine type from DSSR
alter table public.ssr
  add column if not exists machine_type text;

-- Point 8: Assign sketcher from inspiration
alter table public.inspirations
  add column if not exists assigned_sketcher_id uuid references public.sketch_artists(id),
  add column if not exists sketcher_assigned_at timestamptz;

-- Point 9: Assign designer from sketch (already has sketch_artist_id, add designer)
alter table public.sketches
  add column if not exists assigned_designer_id uuid references public.designers(id),
  add column if not exists designer_assigned_at timestamptz;

notify pgrst, 'reload schema';

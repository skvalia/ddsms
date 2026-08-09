-- Design Types
create table if not exists public.design_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);
alter table public.design_types enable row level security;
drop policy if exists "auth_all_design_types" on public.design_types;
create policy "auth_all_design_types" on public.design_types
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
insert into public.design_types (name) values
  ('Allover'),('Placement'),('Border'),('Corner'),
  ('Panel'),('Motif'),('Dupatta'),('Saree'),('Blouse')
on conflict (name) do nothing;

-- Sketch Artists
create table if not exists public.sketch_artists (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);
alter table public.sketch_artists enable row level security;
drop policy if exists "auth_all_sketch_artists" on public.sketch_artists;
create policy "auth_all_sketch_artists" on public.sketch_artists
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Designers (Digitisers)
create table if not exists public.designers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);
alter table public.designers enable row level security;
drop policy if exists "auth_all_designers" on public.designers;
create policy "auth_all_designers" on public.designers
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Add FK columns to sketches and dssr
alter table public.sketches
  add column if not exists sketch_artist_id uuid references public.sketch_artists(id);
alter table public.dssr
  add column if not exists designer_id uuid references public.designers(id);

notify pgrst, 'reload schema';

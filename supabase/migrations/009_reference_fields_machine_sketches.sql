-- Point 1: Reference numbers on DSSR and SSR
alter table public.dssr
  add column if not exists your_ref_no text,
  add column if not exists machine_type text;

alter table public.ssr
  add column if not exists your_ref_no text;

-- Point 3/4: Multiple sketches per DSSR
-- sketches can link to a DSSR (in addition to inspiration)
alter table public.sketches
  add column if not exists dssr_id uuid references public.dssr(id),
  add column if not exists design_number text,
  add column if not exists punch_status text default 'Pending';
  -- punch_status: Pending | Punching | Punched | Ready

-- Machine types master list
create table if not exists public.machine_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);
alter table public.machine_types enable row level security;
drop policy if exists "auth_all_machine_types" on public.machine_types;
create policy "auth_all_machine_types" on public.machine_types
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into public.machine_types (name) values
  ('Schiffli'),
  ('Multi'),
  ('Aari'),
  ('Cording'),
  ('Pentacut'),
  ('Schiffli-Cording')
on conflict (name) do nothing;

notify pgrst, 'reload schema';

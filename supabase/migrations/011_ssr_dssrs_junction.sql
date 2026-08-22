-- ============================================================
-- Migration 011: Many DSSRs → one SSR + design tracking
-- ============================================================

-- Junction table: many DSSRs can link to one SSR
create table if not exists public.ssr_dssrs (
  id uuid primary key default uuid_generate_v4(),
  ssr_id uuid not null references public.ssr(id) on delete cascade,
  dssr_id uuid not null references public.dssr(id) on delete cascade,
  added_at timestamptz default now(),
  unique(ssr_id, dssr_id)
);
alter table public.ssr_dssrs enable row level security;
create policy "auth_all_ssr_dssrs" on public.ssr_dssrs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Copy existing ssr.dssr_id links into junction table
insert into public.ssr_dssrs (ssr_id, dssr_id)
  select id, dssr_id from public.ssr
  where dssr_id is not null
on conflict (ssr_id, dssr_id) do nothing;

-- Design tracking per SSR (track each design/sketch independently)
create table if not exists public.ssr_design_tracking (
  id uuid primary key default uuid_generate_v4(),
  ssr_id uuid not null references public.ssr(id) on delete cascade,
  dssr_id uuid references public.dssr(id),
  sketch_id uuid references public.sketches(id),
  design_number text,
  status text default 'Pending',
  notes text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.ssr_design_tracking enable row level security;
create policy "auth_all_ssr_design_tracking" on public.ssr_design_tracking
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- SSR machine type (overridable, inherits from DSSR)
alter table public.ssr
  add column if not exists machine_type_override text;

-- Index
create index if not exists idx_ssr_dssrs_ssr on public.ssr_dssrs(ssr_id);
create index if not exists idx_ssr_dssrs_dssr on public.ssr_dssrs(dssr_id);
create index if not exists idx_ssr_design_ssr on public.ssr_design_tracking(ssr_id);

notify pgrst, 'reload schema';

-- =========================================================
-- DDSMS Migration 007
-- Inspirations + Sketches tables
-- + sketch_id link on DSSR
-- =========================================================

-- ── INSPIRATIONS ─────────────────────────────────────────
create table public.inspirations (
  id uuid primary key default uuid_generate_v4(),
  concept_name text not null,
  party_id uuid references public.parties(id),
  season text,
  design_count integer,
  notes text,
  photo_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.inspirations enable row level security;
create policy "auth_all_inspirations" on public.inspirations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── SKETCHES ─────────────────────────────────────────────
create table public.sketches (
  id uuid primary key default uuid_generate_v4(),
  sketch_number text,
  inspiration_id uuid references public.inspirations(id),
  description text,
  sketched_by text,
  notes text,
  photo_path text,
  status text default 'Draft',
    -- Draft | Ready for DSSR | In Progress | Completed
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sketches enable row level security;
create policy "auth_all_sketches" on public.sketches
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── DSSR: add sketch link ────────────────────────────────
alter table public.dssr
  add column if not exists sketch_id uuid references public.sketches(id);

-- ── Storage buckets ──────────────────────────────────────
-- Run these in Supabase dashboard Storage section:
-- 1. Create bucket: inspiration-files (public)
-- 2. Create bucket: sketch-files (public)

-- ── Indexes ──────────────────────────────────────────────
create index if not exists idx_sketches_inspiration on public.sketches(inspiration_id);
create index if not exists idx_dssr_sketch on public.dssr(sketch_id);

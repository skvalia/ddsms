-- =========================================================
-- DDSMS - Design Development & Sampling Management System
-- Phase 1 Schema
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- USERS (profile table, linked to Supabase auth.users)
-- ---------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'staff', -- admin | designer | sampling | viewer
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- PARTIES (customers / self - used across DSSR & SSR)
-- ---------------------------------------------------------
create table public.parties (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  notes text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- PROJECTS
-- A project groups inspirations, sketches, and one DSSR
-- ---------------------------------------------------------
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  customer_name text,
  description text,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------
-- MODULE 1: INSPIRATION LIBRARY
-- ---------------------------------------------------------
create table public.inspirations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete set null,
  title text,
  category text check (category in (
    'Floral','Geometric','Placement','Border','Allover',
    'Ethnic','Kids','Womenswear','Menswear','Luxury'
  )),
  tags text[] default '{}',
  notes text,
  image_path text not null, -- supabase storage path
  uploaded_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index idx_inspirations_category on public.inspirations(category);
create index idx_inspirations_tags on public.inspirations using gin(tags);
create index idx_inspirations_project on public.inspirations(project_id);

-- ---------------------------------------------------------
-- MODULE 2: SKETCH DEVELOPMENT
-- ---------------------------------------------------------
create table public.sketches (
  id uuid primary key default uuid_generate_v4(),
  sketch_code text unique, -- human friendly e.g. SKT-001
  project_id uuid references public.projects(id) on delete cascade,
  designer text,
  description text,
  status text default 'New' check (status in (
    'New','Under Design','Review','Approved','Rejected'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sketches_project on public.sketches(project_id);
create index idx_sketches_status on public.sketches(status);

-- sketch files (photo / pdf / ai / cdr)
create table public.sketch_files (
  id uuid primary key default uuid_generate_v4(),
  sketch_id uuid references public.sketches(id) on delete cascade,
  file_path text not null,
  file_type text, -- jpg, png, pdf, ai, cdr
  uploaded_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index idx_sketch_files_sketch on public.sketch_files(sketch_id);

-- ---------------------------------------------------------
-- MODULE 3: DSSR - Design Development Request Register
-- Master design record, versioned
-- ---------------------------------------------------------
create table public.dssr (
  id uuid primary key default uuid_generate_v4(),
  dssr_number text unique not null,   -- e.g. DSSR-001
  design_number text,                  -- e.g. KB-8-1007878
  project_id uuid references public.projects(id) on delete set null,
  party_id uuid references public.parties(id),
  designer text,
  design_type text,
  target_completion_date date,
  priority text default 'Medium' check (priority in ('High','Medium','Low')),
  status text default 'New' check (status in (
    'New','CAD Development','EMB Development','Ready For Sampling',
    'Sampling Active','Approved','Archived'
  )),
  current_version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_dssr_project on public.dssr(project_id);
create index idx_dssr_party on public.dssr(party_id);
create index idx_dssr_status on public.dssr(status);
create index idx_dssr_design_number on public.dssr(design_number);

-- DSSR versions (Design A V1, V2, V3 ...). Old files remain accessible.
create table public.dssr_versions (
  id uuid primary key default uuid_generate_v4(),
  dssr_id uuid references public.dssr(id) on delete cascade,
  version_number int not null,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  unique (dssr_id, version_number)
);

create index idx_dssr_versions_dssr on public.dssr_versions(dssr_id);

-- DSSR files (sketch / CAD / PDF / EMB / DST / AI / CDR), tied to a version
create table public.dssr_files (
  id uuid primary key default uuid_generate_v4(),
  dssr_id uuid references public.dssr(id) on delete cascade,
  dssr_version_id uuid references public.dssr_versions(id) on delete cascade,
  file_path text not null,
  file_type text, -- sketch, cad, pdf, emb, dst, ai, cdr, photo, video
  label text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index idx_dssr_files_dssr on public.dssr_files(dssr_id);
create index idx_dssr_files_version on public.dssr_files(dssr_version_id);

-- ---------------------------------------------------------
-- MODULE 4: SSR - Sampling Status Register
-- ---------------------------------------------------------
create table public.ssr (
  id uuid primary key default uuid_generate_v4(),
  ssr_number text not null,            -- e.g. 25204 (kept as text, supports leading text too)
  sample_no text,                       -- e.g. SMP-001
  dssr_id uuid references public.dssr(id) on delete set null,
  party_id uuid references public.parties(id),
  design_number text,                   -- denormalized for quick search/migration
  fabric text,
  yarn text,
  sample_type text,                     -- Schiffli / Aari / Multy / etc.
  machine text,
  operator text,
  sample_purpose text,
  status text default 'YTR' check (status in (
    'YTR','On Machine','Issue','Mending','Dyeing','Packing','Done',
    'Sent To Outside Emb','Completed'
  )),
  issue_type text check (issue_type in (
    'Fabric Issue','Yarn Issue','Design Issue','Machine Issue','Operator Issue', null
  )),
  -- dyeing tracking
  dyeing_required boolean default false,
  dyeing_name text,
  dyeing_challan_no text,
  dyeing_sent_date date,
  dyeing_receive_date date,
  -- dispatch / approval
  party_dispatch_date date,
  approval_status text default 'Pending' check (approval_status in ('Pending','Approved','Rejected','Completed')),
  remarks text,
  entry_date date default current_date,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_ssr_dssr on public.ssr(dssr_id);
create index idx_ssr_party on public.ssr(party_id);
create index idx_ssr_status on public.ssr(status);
create index idx_ssr_ssr_number on public.ssr(ssr_number);
create index idx_ssr_design_number on public.ssr(design_number);
create index idx_ssr_sample_no on public.ssr(sample_no);

-- SSR files (photos, videos, docs)
create table public.ssr_files (
  id uuid primary key default uuid_generate_v4(),
  ssr_id uuid references public.ssr(id) on delete cascade,
  file_path text not null,
  file_type text, -- jpg, png, pdf, mp4, etc.
  label text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index idx_ssr_files_ssr on public.ssr_files(ssr_id);

-- ---------------------------------------------------------
-- STATUS HISTORY (for SSR status flow timeline)
-- ---------------------------------------------------------
create table public.status_history (
  id uuid primary key default uuid_generate_v4(),
  ssr_id uuid references public.ssr(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references public.users(id),
  remarks text,
  changed_at timestamptz default now()
);

create index idx_status_history_ssr on public.status_history(ssr_id);

-- ---------------------------------------------------------
-- COMMENTS (on DSSR or SSR)
-- ---------------------------------------------------------
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  dssr_id uuid references public.dssr(id) on delete cascade,
  ssr_id uuid references public.ssr(id) on delete cascade,
  body text not null,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  check (dssr_id is not null or ssr_id is not null)
);

create index idx_comments_dssr on public.comments(dssr_id);
create index idx_comments_ssr on public.comments(ssr_id);

-- ---------------------------------------------------------
-- ACTIVITY LOGS (global timeline / audit trail)
-- ---------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,  -- 'project','inspiration','sketch','dssr','ssr','comment','file'
  entity_id uuid not null,
  action text not null,       -- 'created','updated','status_changed','file_uploaded','comment_added'
  description text,
  meta jsonb default '{}',
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);
create index idx_activity_logs_created_at on public.activity_logs(created_at desc);

-- =========================================================
-- PHASE 2 PLACEHOLDER COLUMNS / TABLES (structure only, not used yet)
-- =========================================================

-- enable pgvector extension before using the vector type below
create extension if not exists vector;

-- Embedding-ready columns for future visual / reverse image search
alter table public.inspirations add column embedding vector(512);
alter table public.sketch_files add column embedding vector(512);
alter table public.dssr_files add column embedding vector(512);

-- AI tagging suggestions table (future)
create table public.ai_tags (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,  -- 'inspiration','sketch_file','dssr_file'
  entity_id uuid not null,
  tag text not null,
  confidence numeric,
  created_at timestamptz default now()
);

create index idx_ai_tags_entity on public.ai_tags(entity_type, entity_id);

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create trigger trg_sketches_updated_at before update on public.sketches
  for each row execute function public.set_updated_at();

create trigger trg_dssr_updated_at before update on public.dssr
  for each row execute function public.set_updated_at();

create trigger trg_ssr_updated_at before update on public.ssr
  for each row execute function public.set_updated_at();

-- =========================================================
-- AUTO STATUS HISTORY TRIGGER (SSR)
-- =========================================================
create or replace function public.log_ssr_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.status_history (ssr_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, new.created_by);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.status_history (ssr_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, new.created_by);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_ssr_status_history
  after insert or update on public.ssr
  for each row execute function public.log_ssr_status_change();

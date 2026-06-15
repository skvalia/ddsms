-- =========================================================
-- DDSMS - Stage tracking for SSR files
-- Links uploaded files (concept images, sketches, EMB, sample
-- photos) to the sampling stage they were captured at, so the
-- full sequence of a sample's development is preserved.
-- =========================================================

-- Stage label for each file: which point in the sampling
-- sequence this image/document belongs to.
alter table public.ssr_files
  add column stage text default 'General' check (stage in (
    'Concept',        -- inspiration / reference image
    'Sketch',         -- hand sketch or design concept
    'CAD',            -- CAD file preview
    'EMB',            -- embroidery / punching file
    'On Machine',     -- photo while sample is being made
    'Sample Photo',   -- finished sample photo
    'Dyeing',         -- before/after dyeing photo
    'Final',          -- final approved sample photo
    'General'         -- anything else / unsorted
  ));

-- Optionally link a file to the specific status_history entry
-- that was active when it was uploaded, so the timeline and
-- gallery can be cross-referenced.
alter table public.ssr_files
  add column status_history_id uuid references public.status_history(id) on delete set null;

create index idx_ssr_files_stage on public.ssr_files(stage);
create index idx_ssr_files_status_history on public.ssr_files(status_history_id);

-- Same stage concept for DSSR files (concept/sketch/CAD/EMB
-- at the master-design level, before sampling starts)
alter table public.dssr_files
  add column stage text default 'General' check (stage in (
    'Concept', 'Sketch', 'CAD', 'EMB', 'General'
  ));

create index idx_dssr_files_stage on public.dssr_files(stage);

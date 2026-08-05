-- =========================================================
-- DDSMS Migration 006 - Costing Fields
-- Adds all production & costing inputs to SSR records
-- derived from QUOTATION_COSTING_UTILITY_v13_MASTER.xlsx
-- =========================================================

alter table public.ssr

  -- ── Machine & production ──────────────────────────────
  add column if not exists machine_type text,
    -- Saurer Epoca (Schiffli) | Multi Machine | Aari Machine
  add column if not exists machine_repeat text,
    -- e.g. 4x4, 8x4, 16x4
  add column if not exists revolutions integer,
    -- stitch count from EM Studio
  add column if not exists design_height_mm numeric,
    -- design height in mm
  add column if not exists needle_count integer,
    -- number of needles used
  add column if not exists machine_in_datetime timestamptz,
  add column if not exists machine_out_datetime timestamptz,
  add column if not exists pieces_per_shift integer,

  -- ── Yarn (production actuals) ─────────────────────────
  add column if not exists yarn_front_length_m numeric,
    -- front yarn length in metres (from EM Studio)
  add column if not exists yarn_back_length_m numeric,
    -- back yarn length in metres (from EM Studio)
  add column if not exists yarn_actual_weight_g numeric,
    -- actual yarn weight in grams (if different from theoretical)
  add column if not exists stitch_rate numeric,
    -- override stitch rate (₹ per stitch)
  add column if not exists mending_cost_per_mtr numeric,
    -- mending cost per metre

  -- ── Fabric ───────────────────────────────────────────
  add column if not exists fabric_width_inches numeric,
  add column if not exists fabric_rate_per_mtr numeric,
    -- ₹ per metre
  add column if not exists fabric_cut_length_mtr numeric,
  add column if not exists fabric_value_loss_pct numeric default 4,
    -- % loss during processing

  -- ── Dyeing ───────────────────────────────────────────
  add column if not exists dyeing_mill text,
    -- mill name e.g. Bhairav, Jeen Mata
  add column if not exists dyeing_shade text,
    -- White | Light | Medium | Dark | Extra Dark | Finishing
  add column if not exists dyeing_cost_per_mtr numeric,
    -- ₹ per metre (manual override)
  add column if not exists dyeing_mtr_realisation numeric,
    -- metres realised after dyeing (shrinkage)

  -- ── Finishing / packing ───────────────────────────────
  add column if not exists packing_inner boolean default false,
  add column if not exists packing_outer boolean default false,
  add column if not exists scallop_sides integer default 0,
    -- 0 = none, 1-6 sides
  add column if not exists packing_type text,
    -- Book Fold | Roll Packing | None
  add column if not exists has_stone boolean default false,
  add column if not exists thread_cutting_extra boolean default false,
  add column if not exists spotting_cost boolean default false,
  add column if not exists corrugated_box boolean default false,
  add column if not exists pieces_per_bardan integer,

  -- ── Sales / margin ────────────────────────────────────
  add column if not exists margin_profit_pct numeric default 15,
  add column if not exists margin_brokerage_pct numeric default 2,
  add column if not exists margin_cash_discount_pct numeric default 3,
  add column if not exists margin_interest_pct numeric default 0,
  add column if not exists margin_incentive_pct numeric default 0,
  add column if not exists margin_marketing_pct numeric default 0,

  -- ── Calculated outputs (stored for reference/export) ──
  add column if not exists calc_cost_per_mtr numeric,
  add column if not exists calc_cost_per_pc numeric,
  add column if not exists calc_selling_price_mtr numeric,
  add column if not exists calc_selling_price_pc numeric,
  add column if not exists costing_notes text,
  add column if not exists costing_locked boolean default false;
    -- when true, costing is finalised and shouldn't change

comment on column public.ssr.revolutions is 'Total stitch count from EM Studio / punching software';
comment on column public.ssr.machine_repeat is 'Machine repeat area e.g. 4x4=KB-4, 8x4=KB-8 etc.';
comment on column public.ssr.calc_cost_per_mtr is 'Auto-calculated cost per metre (Phase 3)';
comment on column public.ssr.costing_locked is 'When true, costing is finalised — shown as approved on record';

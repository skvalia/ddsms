-- =========================================================
-- DDSMS - Outsource embroidery tracking
-- Mirrors the dyeing fields, for samples sent to outside
-- embroidery units (e.g. "Silver Touch, challan 000131")
-- =========================================================

alter table public.ssr
  add column outsource_unit_name text,
  add column outsource_challan_no text,
  add column outsource_sent_date date,
  add column outsource_receive_date date;

comment on column public.ssr.outsource_unit_name is 'Outside embroidery unit the sample was sent to (e.g. Silver Touch)';
comment on column public.ssr.outsource_challan_no is 'Challan number for outside embroidery dispatch';
comment on column public.ssr.outsource_sent_date is 'Date sample was sent to outside embroidery unit';
comment on column public.ssr.outsource_receive_date is 'Date sample was received back from outside embroidery unit';

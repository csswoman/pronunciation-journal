-- Allow AI-Coach explanations to be stored as tracked items.
-- The original constraint (20260718211317_create_tracked_items.sql) is the
-- Postgres-default name for `kind text not null check (kind in ('phrase','lesson'))`.
alter table public.tracked_items drop constraint tracked_items_kind_check;
alter table public.tracked_items add constraint tracked_items_kind_check
  check (kind in ('phrase', 'lesson', 'explanation'));

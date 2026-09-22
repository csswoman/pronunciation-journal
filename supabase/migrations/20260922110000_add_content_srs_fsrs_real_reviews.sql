-- Preserve FSRS optimizer provenance when a chunk or fragment schedule moves
-- between devices. Null remains the legacy/fresh-card representation.
alter table public.content_srs
  add column if not exists fsrs_real_reviews integer;

alter table public.content_srs
  drop constraint if exists content_srs_fsrs_real_reviews_nonnegative;

alter table public.content_srs
  add constraint content_srs_fsrs_real_reviews_nonnegative
  check (fsrs_real_reviews is null or fsrs_real_reviews >= 0);

-- Add columns missing from the initial word_bank migration.
ALTER TABLE public.word_bank
  ADD COLUMN IF NOT EXISTS error_reason  text,
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_count   integer NOT NULL DEFAULT 0;

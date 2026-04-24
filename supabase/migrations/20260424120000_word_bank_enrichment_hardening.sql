-- Word bank enrichment hardening
-- Adds error telemetry and spaced-repetition fields, plus explicit indexes.

ALTER TABLE public.word_bank
  ADD COLUMN IF NOT EXISTS error_reason text,
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.word_bank
  ADD CONSTRAINT word_bank_error_reason_check
  CHECK (error_reason IS NULL OR error_reason IN ('parse_error', 'api_error'));

CREATE INDEX IF NOT EXISTS idx_word_bank_user_created
  ON public.word_bank (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_word_bank_status
  ON public.word_bank (status);

COMMENT ON COLUMN public.word_bank.error_reason IS 'Why the last enrichment attempt failed.';
COMMENT ON COLUMN public.word_bank.next_review_at IS 'Next scheduled review timestamp for spaced repetition.';
COMMENT ON COLUMN public.word_bank.review_count IS 'How many times the word has been reviewed.';

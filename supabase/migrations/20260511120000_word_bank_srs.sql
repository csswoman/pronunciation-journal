-- SM-2 spaced repetition fields on word_bank.
-- next_review_at and review_count already exist (added in 20260423130000_word_bank_add_columns.sql).
-- We add the SM-2 state needed to study word_bank entries via StudyModal.
-- Uses srs_status (not status) to avoid clashing with the existing enrichment status column.

ALTER TABLE public.word_bank
  ADD COLUMN IF NOT EXISTS ease_factor      float       NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days    int         NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS repetitions      int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS srs_status       text        NOT NULL DEFAULT 'new'
                                                        CHECK (srs_status IN ('new','learning','review','mastered')),
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS word_bank_next_review_idx
  ON public.word_bank (user_id, next_review_at)
  WHERE srs_status <> 'mastered';

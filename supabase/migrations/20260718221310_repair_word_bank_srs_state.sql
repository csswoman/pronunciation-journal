-- Repair historical rows written by the pre-hardening manual SRS paths.
--
-- Phase-2 penalties were the only application path that persisted an interval
-- of zero. Model them as a lapse without changing their learned ease or due
-- instant. When the old write omitted last_reviewed_at, its scheduled next day
-- is the best available source for the review instant.
WITH repaired_zero_intervals AS (
  UPDATE public.word_bank
  SET
    srs_status = 'learning',
    interval_days = 1,
    repetitions = 0,
    last_reviewed_at = COALESCE(
      last_reviewed_at,
      next_review_at - INTERVAL '1 day',
      updated_at,
      created_at
    )
  WHERE interval_days = 0
  RETURNING id
)

-- Forgotten flashcards already had the correct one-day lapse interval and
-- review metadata, but were incorrectly labelled as new. A genuinely new row
-- has neither a review count nor last_reviewed_at.
UPDATE public.word_bank
SET srs_status = 'learning'
WHERE srs_status = 'new'
  AND interval_days = 1
  AND repetitions = 0
  AND (review_count > 0 OR last_reviewed_at IS NOT NULL);

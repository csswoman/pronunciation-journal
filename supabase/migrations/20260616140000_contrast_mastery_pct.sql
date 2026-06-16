-- Dynamic mastery percentage per contrast (EMA with temporal decay).

ALTER TABLE public.user_contrast_progress
  ADD COLUMN IF NOT EXISTS mastery_pct numeric(5, 2) NOT NULL DEFAULT 0
  CHECK (mastery_pct >= 0 AND mastery_pct <= 100);

-- Seed existing rows from lifetime accuracy so the UI is not empty post-migration.
UPDATE public.user_contrast_progress
SET mastery_pct = ROUND(
  LEAST(100, GREATEST(0, (correct_answers::numeric / NULLIF(total_attempts, 0)) * 100)),
  2
)
WHERE total_attempts > 0 AND mastery_pct = 0;

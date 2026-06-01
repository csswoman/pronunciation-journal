-- Add CHECK constraint for answer_history.context allowed values.
-- Decision: normalize unexpected existing values to 'practice' (instead of aborting)
-- so the migration is backward-compatible with legacy rows/data.

-- 1) Verify whether invalid values exist.
SELECT "context", COUNT(*) AS count
FROM "public"."answer_history"
WHERE "context" IS NOT NULL
  AND "context" NOT IN ('sound_lab', 'courses', 'ai_coach', 'practice', 'daily')
GROUP BY "context";

-- 2) Normalize invalid contexts before enforcing the CHECK constraint.
UPDATE "public"."answer_history"
SET "context" = 'practice'
WHERE "context" IS NOT NULL
  AND "context" NOT IN ('sound_lab', 'courses', 'ai_coach', 'practice', 'daily');

-- 3) Enforce allowed values.
ALTER TABLE "public"."answer_history"
  DROP CONSTRAINT IF EXISTS "answer_history_context_check";

ALTER TABLE "public"."answer_history"
  ADD CONSTRAINT "answer_history_context_check"
  CHECK ("context" IN ('sound_lab', 'courses', 'ai_coach', 'practice', 'daily'));

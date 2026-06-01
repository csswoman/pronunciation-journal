ALTER TABLE "public"."answer_history"
  ADD COLUMN IF NOT EXISTS "grade" smallint;

ALTER TABLE "public"."answer_history"
  DROP CONSTRAINT IF EXISTS "answer_history_grade_range";

ALTER TABLE "public"."answer_history"
  ADD CONSTRAINT "answer_history_grade_range"
  CHECK ("grade" IS NULL OR ("grade" >= 0 AND "grade" <= 5));

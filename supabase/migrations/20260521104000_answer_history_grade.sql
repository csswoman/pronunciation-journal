ALTER TABLE "public"."answer_history"
  ADD COLUMN "grade" smallint;

ALTER TABLE "public"."answer_history"
  ADD CONSTRAINT "answer_history_grade_range"
  CHECK ("grade" IS NULL OR ("grade" >= 0 AND "grade" <= 5));

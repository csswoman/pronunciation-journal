-- Practice Engine: add context and content_id to answer_history
-- Enables the unified Practice Engine to record which surface originated
-- an answer (sound_lab, courses, ai_coach, practice) and the specific
-- content being practiced (word slug, lesson id, soundId, etc.).

ALTER TABLE "public"."answer_history"
  ADD COLUMN IF NOT EXISTS "context" text;

ALTER TABLE "public"."answer_history"
  ADD COLUMN IF NOT EXISTS "content_id" text;

COMMENT ON COLUMN "public"."answer_history"."context" IS
  'sound_lab | courses | ai_coach | practice';

COMMENT ON COLUMN "public"."answer_history"."content_id" IS
  'Identificador del contenido practicado: word slug, lesson id, soundId, etc.';

-- RLS is already enabled on answer_history (see 20260329230234_remote_schema.sql).
-- Existing policies "Manage own answer_history", "Users can insert own history",
-- and "Users can view own history" continue to cover the new columns.
ALTER TABLE "public"."answer_history" ENABLE ROW LEVEL SECURITY;

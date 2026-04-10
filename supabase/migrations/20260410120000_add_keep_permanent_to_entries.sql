-- Add keep_permanent flag to entries table.
-- When true, the audio cleanup Edge Function will skip this entry's user_audio_url
-- regardless of age. Use this for "Formal Lesson" recordings the user wants to keep.
ALTER TABLE "public"."entries"
  ADD COLUMN IF NOT EXISTS "keep_permanent" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."entries"."keep_permanent" IS
  'When true, the weekly audio-cleanup job will never delete this entry''s user_audio_url, even after 30 days.';

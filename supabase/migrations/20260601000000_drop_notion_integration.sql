-- Remove legacy Notion sync artifacts (app no longer integrates with Notion).

DROP TABLE IF EXISTS public.notion_sync_log;

ALTER TABLE public.theory_lessons
  DROP COLUMN IF EXISTS notion_last_edited,
  DROP COLUMN IF EXISTS notion_page_id,
  DROP COLUMN IF EXISTS notion_synced_at;

-- Lesson provenance for user-created content (replaces notion-synced rows).
ALTER TABLE public.theory_lessons
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

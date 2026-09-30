-- Plan 045: accept the canonical Essential Words context in answer_history.
--
-- lib/essential-words/runtime-engine.ts writes context = 'essential-words'
-- (PracticeContext in lib/practice/types.ts), but the CHECK from
-- 20260616120000_answer_history_contexts.sql only admits the legacy
-- 'core-1000' spelling, so every Essential Words answer was rejected with
-- 23514 and parked as a permanent outbox failure.
--
-- Preserves every previously admitted context ('core-1000' stays for
-- historical rows). Existing rows already satisfy the old, narrower CHECK,
-- so re-adding the widened constraint validates without rewriting data.
--
-- Inspection (run before and after applying):
--   SELECT pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.answer_history'::regclass
--     AND conname = 'answer_history_context_check';
-- Expected after: CHECK ((context = ANY (ARRAY['sound_lab'::text, 'courses'::text,
--   'ai_coach'::text, 'practice'::text, 'daily'::text, 'core-1000'::text,
--   'review'::text, 'essential-words'::text])))

ALTER TABLE public.answer_history
  DROP CONSTRAINT IF EXISTS answer_history_context_check;

ALTER TABLE public.answer_history
  ADD CONSTRAINT answer_history_context_check
  CHECK (context IN (
    'sound_lab',
    'courses',
    'ai_coach',
    'practice',
    'daily',
    'core-1000',
    'review',
    'essential-words'
  ));

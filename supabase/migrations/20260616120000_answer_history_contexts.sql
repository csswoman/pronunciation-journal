-- Extend answer_history.context to include Essential Words and the global review hub.
-- Without this, savePracticeAnswer(context='core-1000') fails the CHECK constraint silently.

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
    'review'
  ));

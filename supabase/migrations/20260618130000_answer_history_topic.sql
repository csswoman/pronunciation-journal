ALTER TABLE public.answer_history
  ADD COLUMN IF NOT EXISTS topic text;

COMMENT ON COLUMN public.answer_history.topic IS
  'Normalized concept key for the exercise (see normalizeTopic). Nullable: exercises without a topic do not set it.';

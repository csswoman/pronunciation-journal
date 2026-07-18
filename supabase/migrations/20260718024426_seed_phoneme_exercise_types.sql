-- Seed phoneme exercise types used by EXERCISE_TYPE_IDS in lib/practice/types.ts.
-- Fail fast rather than silently accepting an ID <-> slug mismatch from a
-- partially applied or manually edited environment.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.exercise_types
    WHERE (id = 10 AND slug <> 'speak_word')
       OR (id = 11 AND slug <> 'identify')
       OR (id = 12 AND slug <> 'ax_same_different')
       OR (id = 13 AND slug <> 'odd_one_out')
       OR (id = 14 AND slug <> 'abx')
  ) THEN
    RAISE EXCEPTION 'Cannot seed phoneme exercise types: an ID from 10 through 14 is already assigned to a different slug';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.exercise_types
    WHERE (slug = 'speak_word' AND id <> 10)
       OR (slug = 'identify' AND id <> 11)
       OR (slug = 'ax_same_different' AND id <> 12)
       OR (slug = 'odd_one_out' AND id <> 13)
       OR (slug = 'abx' AND id <> 14)
  ) THEN
    RAISE EXCEPTION 'Cannot seed phoneme exercise types: a phoneme slug is already assigned to a different ID';
  END IF;
END $$;

INSERT INTO public.exercise_types (id, slug, label) VALUES
  (10, 'speak_word',        'Speak It'),
  (11, 'identify',          'Identify sound'),
  (12, 'ax_same_different', 'Same or different'),
  (13, 'odd_one_out',       'Odd one out'),
  (14, 'abx',               'ABX')
ON CONFLICT DO NOTHING;

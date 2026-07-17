-- Remove duplicate public.words rows left by re-running the sounds seed
-- (ON CONFLICT only protected sounds.ipa; words had no uniqueness).
-- Keep the earliest id per (sound_id, lower(word)).

DELETE FROM public.words AS dup
WHERE dup.sound_id IS NOT NULL
  AND dup.id IN (
    SELECT id
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY sound_id, lower(word)
          ORDER BY id
        ) AS rn
      FROM public.words
      WHERE sound_id IS NOT NULL
    ) ranked
    WHERE ranked.rn > 1
  );

-- Prevent the same lemma from being inserted twice for one sound.
CREATE UNIQUE INDEX IF NOT EXISTS words_sound_id_word_lower_uidx
  ON public.words (sound_id, (lower(word)))
  WHERE sound_id IS NOT NULL;

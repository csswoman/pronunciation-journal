-- Recategorize mislabeled text_fragments.
--
-- ~55 system rows were seeded with fragment_type='sentence' but are actually
-- lesson notation, not sentences:
--   - transformation / mapping:  "going to → gonna", "By myself = solo"
--   - slash alternation:         "turn off / turn it off"
--   - POS / stress notation:     "PREsent (n.) / preSENT (v.)"
--
-- These fed the reorder ("Arma la oración") and connected-speech dictation
-- generators, producing nonsensical exercises (tiles like [going, to, →, gonna]).
-- A runtime guard (lib/exercises/utils.ts isLikelySentence) already filters them,
-- but they should not carry the 'sentence' label. We move them to 'note' so they
-- stop being fetched as sentences without losing the study material.
--
-- The WHERE clause mirrors isLikelySentence() exactly (negated), so data and code
-- stay in agreement. Scoped to system rows (user_id IS NULL) only.

UPDATE text_fragments
SET fragment_type = 'note'
WHERE fragment_type = 'sentence'
  AND user_id IS NULL
  AND (
       content ~ '[→=]'                          -- transformation / mapping notation
    OR content ~ '\s/\s'                          -- slash alternation between alternatives
    OR content ~* '\((n|v|adj|adv|prep)\.\)'      -- part-of-speech / stress notation
  );

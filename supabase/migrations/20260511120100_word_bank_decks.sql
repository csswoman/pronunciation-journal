-- Junction table: many-to-many between word_bank entries and decks.
-- Lets users add their captured words into existing decks, and powers the
-- "create deck from selected words" flow without touching the legacy
-- entries / deck_entries pair (which stays for sound-practice decks).

CREATE TABLE IF NOT EXISTS public.word_bank_decks (
  word_id  uuid NOT NULL REFERENCES public.word_bank(id) ON DELETE CASCADE,
  deck_id  uuid NOT NULL REFERENCES public.decks(id)     ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (word_id, deck_id)
);

CREATE INDEX IF NOT EXISTS word_bank_decks_deck_idx
  ON public.word_bank_decks (deck_id);

ALTER TABLE public.word_bank_decks ENABLE ROW LEVEL SECURITY;

-- A user can read/write a link only when the underlying word belongs to them.
-- (decks already enforce user_id via app logic; the word_bank ownership check
--  is the canonical gate.)
DROP POLICY IF EXISTS "word_bank_decks_select" ON public.word_bank_decks;
DROP POLICY IF EXISTS "word_bank_decks_insert" ON public.word_bank_decks;
DROP POLICY IF EXISTS "word_bank_decks_delete" ON public.word_bank_decks;

CREATE POLICY "word_bank_decks_select" ON public.word_bank_decks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.word_bank w
      WHERE w.id = word_bank_decks.word_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "word_bank_decks_insert" ON public.word_bank_decks
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.word_bank w
      WHERE w.id = word_bank_decks.word_id
        AND w.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.decks d
      WHERE d.id = word_bank_decks.deck_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "word_bank_decks_delete" ON public.word_bank_decks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.word_bank w
      WHERE w.id = word_bank_decks.word_id
        AND w.user_id = auth.uid()
    )
  );

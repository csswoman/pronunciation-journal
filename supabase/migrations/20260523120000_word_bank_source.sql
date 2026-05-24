-- Track where a word_bank entry originated.
-- source: 'manual' | 'lexicon' | 'practice' (open-ended text so we can add more later)
-- source_ref: opaque id within that source (e.g. lexicon word id)
-- Merge policy: if a row already exists for this user+text, source is NOT overwritten —
-- the first intent wins. source_ref is only set on initial insert.

ALTER TABLE "public"."word_bank"
  ADD COLUMN IF NOT EXISTS "source"     text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "source_ref" text DEFAULT NULL;

-- Index for "is this lexicon word already in my word_bank?" lookup
CREATE INDEX IF NOT EXISTS word_bank_source_ref_idx
  ON "public"."word_bank" (user_id, source_ref)
  WHERE source_ref IS NOT NULL;

COMMENT ON COLUMN "public"."word_bank"."source" IS
  'Origin of the entry: manual | lexicon | practice';
COMMENT ON COLUMN "public"."word_bank"."source_ref" IS
  'ID within the source system (e.g. lexicon word id). Immutable after insert.';

ALTER TABLE word_bank
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Add CEFR level to user_profiles
-- Persists the level previously only stored in Dexie (UserLearningState.level.cefrEstimate)

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS cefr_level TEXT NOT NULL DEFAULT 'B1'
  CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

COMMENT ON COLUMN user_profiles.cefr_level IS
  'CEFR level estimate (A1–C2). Updated at end of session from client cefrEstimate.';

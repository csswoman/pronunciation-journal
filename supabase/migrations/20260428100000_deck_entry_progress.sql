-- SM-2 progress tracking per user per deck entry
CREATE TABLE IF NOT EXISTS deck_entry_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id        uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  ease_factor     float  NOT NULL DEFAULT 2.5,
  interval_days   int    NOT NULL DEFAULT 1,
  repetitions     int    NOT NULL DEFAULT 0,
  next_review_at  timestamptz NOT NULL DEFAULT now(),
  status          text   NOT NULL DEFAULT 'new' CHECK (status IN ('new','learning','review','mastered')),
  last_reviewed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_id)
);

ALTER TABLE deck_entry_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own deck progress"
  ON deck_entry_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_deck_entry_progress_updated_at
  BEFORE UPDATE ON deck_entry_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Session-level activity log for Progress history and daily-plan reconciliation.

CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source              text NOT NULL,
  practice_context    text,
  skill_tags          text[] NOT NULL DEFAULT '{}',
  exercises_total     integer NOT NULL DEFAULT 0 CHECK (exercises_total >= 0),
  exercises_correct   integer NOT NULL DEFAULT 0 CHECK (exercises_correct >= 0),
  accuracy_pct        integer NOT NULL DEFAULT 0 CHECK (accuracy_pct BETWEEN 0 AND 100),
  duration_ms         integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  xp_earned           integer NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  reconciled_step_ids text[] NOT NULL DEFAULT '{}',
  completed_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_sessions_user_completed_idx
  ON public.activity_sessions (user_id, completed_at DESC);

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own activity sessions" ON public.activity_sessions;

CREATE POLICY "users manage own activity sessions"
  ON public.activity_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

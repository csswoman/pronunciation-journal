-- Migration: 20260927020000_contrast_raw_mastery_and_events.sql
-- Plan 048: Decouple raw EMA from presentation mastery and handle concurrent contrast writes transactionally

-- 1. Add raw_mastery column to user_contrast_progress
ALTER TABLE public.user_contrast_progress
  ADD COLUMN IF NOT EXISTS raw_mastery numeric(5, 2) NULL,
  ADD COLUMN IF NOT EXISTS raw_mastery_updated_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS mastery_session_count integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_contrast_progress_raw_mastery_check'
  ) THEN
    ALTER TABLE public.user_contrast_progress
      ADD CONSTRAINT user_contrast_progress_raw_mastery_check
      CHECK (raw_mastery IS NULL OR (raw_mastery >= 0 AND raw_mastery <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_contrast_progress_mastery_session_count_check'
  ) THEN
    ALTER TABLE public.user_contrast_progress
      ADD CONSTRAINT user_contrast_progress_mastery_session_count_check
      CHECK (mastery_session_count >= 0);
  END IF;
END $$;

-- 2. Create idempotency event log for contrast practice sessions
CREATE TABLE IF NOT EXISTS public.contrast_session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL,
  contrast_id text NOT NULL,
  session_total integer NOT NULL CHECK (session_total > 0),
  session_correct integer NOT NULL CHECK (session_correct >= 0 AND session_correct <= session_total),
  session_accuracy numeric(5, 2) NOT NULL CHECK (session_accuracy >= 0 AND session_accuracy <= 100),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  session_passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, attempt_id, contrast_id)
);

ALTER TABLE public.contrast_session_events
  ADD COLUMN IF NOT EXISTS session_accuracy numeric(5, 2),
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS session_passed boolean NOT NULL DEFAULT false;

UPDATE public.contrast_session_events
SET session_accuracy = ROUND((session_correct::numeric / NULLIF(session_total, 0)) * 100, 2)
WHERE session_accuracy IS NULL;

UPDATE public.contrast_session_events
SET occurred_at = created_at
WHERE occurred_at IS NULL;

UPDATE public.contrast_session_events
SET session_passed = session_correct >= ceil(session_total / 2.0)
WHERE session_passed IS NULL;

ALTER TABLE public.contrast_session_events
  ALTER COLUMN session_accuracy SET NOT NULL,
  ALTER COLUMN occurred_at SET NOT NULL,
  ALTER COLUMN session_passed SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contrast_session_events_session_accuracy_check'
  ) THEN
    ALTER TABLE public.contrast_session_events
      ADD CONSTRAINT contrast_session_events_session_accuracy_check
      CHECK (session_accuracy >= 0 AND session_accuracy <= 100);
  END IF;
END $$;

ALTER TABLE public.contrast_session_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users insert own contrast session events" ON public.contrast_session_events;
CREATE POLICY "users insert own contrast session events"
  ON public.contrast_session_events FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users read own contrast session events" ON public.contrast_session_events;
CREATE POLICY "users read own contrast session events"
  ON public.contrast_session_events FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- 3. Transactional contrast session RPC with incremental deltas.
-- The client sends immutable evidence; the server locks the row and derives
-- the next EMA, projection and SRS state from the latest committed state.
DROP FUNCTION IF EXISTS public.apply_contrast_session_result(
  text, integer, integer, integer, numeric, integer, timestamptz, numeric, numeric, uuid
);
DROP FUNCTION IF EXISTS public.apply_contrast_session_result(
  text, integer, integer, integer, numeric, integer, timestamptz, numeric,
  numeric, uuid, numeric, timestamptz, boolean
);

CREATE FUNCTION public.apply_contrast_session_result(
  p_contrast_id text,
  p_session_correct integer,
  p_session_total integer,
  p_streak integer,
  p_ease_factor numeric,
  p_interval_days integer,
  p_next_review timestamptz,
  p_mastery_pct numeric,
  p_attempt_id uuid,
  p_raw_mastery numeric DEFAULT NULL,
  p_session_accuracy numeric DEFAULT NULL,
  p_occurred_at timestamptz DEFAULT NULL,
  p_session_passed boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_inserted integer;
  v_row public.user_contrast_progress;
  v_accuracy numeric(5, 2);
  v_effective_at timestamptz := least(coalesce(p_occurred_at, now()), now());
  v_raw numeric(5, 2);
  v_prior_raw numeric;
  v_clock timestamptz;
  v_days numeric;
  v_decay numeric;
  v_session_count integer;
  -- Derive pass/fail from immutable counts; never trust a client-supplied flag.
  v_passed boolean := p_session_correct >= ceil(p_session_total / 2.0);
  v_is_stale boolean;
  v_streak integer;
  v_interval integer;
  v_ease numeric;
  v_next_review timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF p_contrast_id IS NULL OR length(trim(p_contrast_id)) = 0 THEN
    RAISE EXCEPTION 'p_contrast_id must not be empty';
  END IF;

  IF p_attempt_id IS NULL THEN
    RAISE EXCEPTION 'p_attempt_id is required for idempotent contrast sessions';
  END IF;
  IF p_session_total IS NULL OR p_session_total <= 0 THEN
    RAISE EXCEPTION 'p_session_total must be greater than zero';
  END IF;
  IF p_session_correct IS NULL OR p_session_correct < 0 OR p_session_correct > p_session_total THEN
    RAISE EXCEPTION 'p_session_correct must be between zero and p_session_total';
  END IF;
  v_accuracy := round(coalesce(p_session_accuracy,
    (p_session_correct::numeric / p_session_total::numeric) * 100), 2);
  IF v_accuracy < 0 OR v_accuracy > 100 THEN
    RAISE EXCEPTION 'p_session_accuracy must be between zero and 100';
  END IF;

  -- Deduplicate replayed sessions by attempt_id
  INSERT INTO public.contrast_session_events (
    user_id, attempt_id, contrast_id, session_total, session_correct,
    session_accuracy, occurred_at, session_passed
  ) VALUES (
    v_user_id, p_attempt_id, p_contrast_id, p_session_total, p_session_correct,
    v_accuracy, v_effective_at, v_passed
  )
  ON CONFLICT (user_id, attempt_id, contrast_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN;
  END IF;

  SELECT * INTO v_row
  FROM public.user_contrast_progress
  WHERE user_id = v_user_id AND contrast_id = p_contrast_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_contrast_progress (
      user_id, contrast_id
    ) VALUES (
      v_user_id, p_contrast_id
    ) ON CONFLICT (user_id, contrast_id) DO NOTHING;

    SELECT * INTO v_row
    FROM public.user_contrast_progress
    WHERE user_id = v_user_id AND contrast_id = p_contrast_id
    FOR UPDATE;
  END IF;

  IF coalesce(v_row.mastery_session_count, 0) = 0
    AND v_row.raw_mastery IS NULL
    AND coalesce(v_row.observation_count, 0) = 0
    AND v_row.total_attempts > 0 THEN
    -- Legacy rows have no session boundary. Mirror the client compatibility
    -- fallback so the first post-migration write does not regress the score.
    v_session_count := v_row.total_attempts + 1;
  ELSE
    v_session_count := coalesce(v_row.mastery_session_count, 0) + 1;
  END IF;

  -- Essential Words can have an old presentation value but no Sound Lab
  -- session. Do not mistake that value for a phoneme EMA.
  v_prior_raw := coalesce(
    v_row.raw_mastery,
    CASE
      WHEN coalesce(v_row.observation_count, 0) = 0 THEN nullif(v_row.mastery_pct, 0)
      ELSE NULL
    END
  );
  v_clock := coalesce(v_row.raw_mastery_updated_at, v_row.last_seen);
  v_is_stale := v_row.last_seen IS NOT NULL AND v_effective_at < v_row.last_seen;
  IF v_prior_raw IS NULL OR v_clock IS NULL THEN
    v_raw := v_accuracy;
  ELSIF v_is_stale THEN
    -- An older offline event must still affect the evidence estimate. A
    -- zero-duration EMA would otherwise discard it entirely; use a bounded
    -- running-average weight while preserving the newer SRS clock/state.
    v_raw := round((v_prior_raw * greatest(v_session_count - 1, 1)::numeric + v_accuracy)
      / (greatest(v_session_count - 1, 1)::numeric + 1), 2);
  ELSE
    v_days := greatest(0, extract(epoch FROM (v_effective_at - v_clock)) / 86400);
    v_decay := exp(-v_days / 14);
    v_raw := round(least(100, greatest(0, v_prior_raw * v_decay + v_accuracy * (1 - v_decay))), 2);
  END IF;
  -- A delayed offline event still contributes immutable evidence and counts,
  -- but must not roll back SRS state produced by a newer event.
  IF v_is_stale THEN
    v_streak := v_row.streak;
    v_interval := v_row.interval_days;
    v_ease := v_row.ease_factor;
    v_next_review := v_row.next_review;
  ELSIF v_passed THEN
    v_streak := v_row.streak + 1;
    v_interval := CASE
      WHEN v_row.interval_days = 1 THEN 3
      WHEN v_row.interval_days = 3 THEN 7
      ELSE round(v_row.interval_days * v_row.ease_factor)
    END;
    v_ease := least(v_row.ease_factor + 0.1, 3.0);
    v_next_review := v_effective_at + make_interval(days => v_interval);
  ELSE
    v_streak := 0;
    v_interval := 1;
    v_ease := greatest(v_row.ease_factor - 0.2, 1.3);
    v_next_review := v_effective_at + make_interval(days => v_interval);
  END IF;

  UPDATE public.user_contrast_progress
  SET total_attempts = v_row.total_attempts + p_session_total,
      correct_answers = v_row.correct_answers + p_session_correct,
      streak = v_streak,
      ease_factor = v_ease,
      interval_days = v_interval,
      mastery_pct = round(v_raw * sqrt(least(v_session_count, 10)::numeric / 10), 2),
      raw_mastery = v_raw,
      raw_mastery_updated_at = greatest(
        coalesce(v_row.raw_mastery_updated_at, v_row.last_seen, v_effective_at),
        v_effective_at
      ),
      mastery_session_count = v_session_count,
      next_review = v_next_review,
      last_seen = greatest(coalesce(v_row.last_seen, v_effective_at), v_effective_at)
  WHERE user_id = v_user_id AND contrast_id = p_contrast_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.apply_contrast_session_result FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_contrast_session_result TO authenticated;

-- Essential Words contributes contrast observations, but it is not a Sound
-- Lab mastery session. Keep its activity from moving the Sound Lab clock.
CREATE OR REPLACE FUNCTION public.apply_essential_word_contrast_observation(
  p_attempt_id uuid, p_contrast_id text, p_weight numeric, p_is_correct boolean
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_inserted boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  INSERT INTO public.essential_word_contrast_observations (
    user_id, attempt_id, contrast_id, weight, is_correct
  ) VALUES (
    v_user_id, p_attempt_id, p_contrast_id, p_weight, p_is_correct
  )
  ON CONFLICT (user_id, attempt_id, contrast_id) DO NOTHING
  RETURNING true INTO v_inserted;

  IF NOT coalesce(v_inserted, false) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_contrast_progress (
    user_id, contrast_id, adaptive_score, observation_count,
    total_attempts, correct_answers
  ) VALUES (
    v_user_id, p_contrast_id,
    (CASE WHEN p_is_correct THEN 0 ELSE p_weight END) * 0.3,
    1, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, contrast_id) DO UPDATE SET
    adaptive_score = user_contrast_progress.adaptive_score * 0.7
      + (CASE WHEN p_is_correct THEN 0 ELSE excluded.adaptive_score / 0.3 END) * 0.3,
    observation_count = user_contrast_progress.observation_count + 1,
    total_attempts = user_contrast_progress.total_attempts + 1,
    correct_answers = user_contrast_progress.correct_answers
      + CASE WHEN p_is_correct THEN 1 ELSE 0 END;
END $$;

REVOKE EXECUTE ON FUNCTION public.apply_essential_word_contrast_observation(uuid, text, numeric, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_essential_word_contrast_observation(uuid, text, numeric, boolean) TO authenticated;

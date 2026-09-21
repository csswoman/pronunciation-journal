ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS cefr_level_source text NOT NULL DEFAULT 'starter_default',
  ADD COLUMN IF NOT EXISTS cefr_level_updated_at timestamptz;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_cefr_level_source_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_cefr_level_source_check
  CHECK (cefr_level_source IN ('placement', 'checkpoint', 'manual', 'practice_estimate', 'starter_default'));

WITH latest AS (
  SELECT DISTINCT ON (result.user_id)
    result.user_id,
    result.mode,
    result.completed_at
  FROM public.assessment_results result
  ORDER BY result.user_id, result.completed_at DESC
)
UPDATE public.user_profiles profile
SET
  cefr_level_source = latest.mode,
  cefr_level_updated_at = latest.completed_at
FROM latest
WHERE profile.id = latest.user_id
  AND profile.cefr_level_source = 'starter_default';

REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
GRANT SELECT (id, created_at, display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests)
  ON TABLE public.user_profiles TO authenticated;
GRANT INSERT (id, display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests)
  ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE (display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests)
  ON TABLE public.user_profiles TO authenticated;
GRANT SELECT (id, created_at, display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests)
  ON TABLE public.user_profiles TO anon;

COMMENT ON COLUMN public.user_profiles.cefr_level_source IS
  'Provenance for the effective learner level; prevents the A1 starter default from masquerading as placement.';

-- Protect cefr_level_source column from unauthorized updates by non-service_role callers,
-- auto-degrade placement/checkpoint source to manual when cefr_level is changed directly by client,
-- default cefr_level_source on INSERT if not valid, and enforce valid CEFR level values.

-- 1. Normalize existing cefr_level values to uppercase if any lowercase values exist
UPDATE public.user_profiles
SET cefr_level = upper(cefr_level)
WHERE cefr_level IS NOT NULL AND cefr_level <> upper(cefr_level);

-- 2. Add CHECK constraint on cefr_level
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_cefr_level_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_cefr_level_check
  CHECK (cefr_level IS NULL OR cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

-- 3. Update protect_user_profiles_privileged_columns trigger function
CREATE OR REPLACE FUNCTION public.protect_user_profiles_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'free';
    NEW.storage_used_kb := 0;
    IF NEW.cefr_level_source IS NULL OR NEW.cefr_level_source NOT IN ('starter_default', 'manual') THEN
      NEW.cefr_level_source := 'starter_default';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.role := OLD.role;
    NEW.storage_used_kb := OLD.storage_used_kb;
    NEW.id := OLD.id;

    -- Block client from updating cefr_level_source to anything other than 'manual'
    IF NEW.cefr_level_source IS DISTINCT FROM OLD.cefr_level_source AND NEW.cefr_level_source <> 'manual' THEN
      RAISE EXCEPTION 'cefr_level_source can only be updated to manual by non-service_role clients';
    END IF;

    -- If cefr_level is updated directly by client and source was placement/checkpoint, degrade to manual
    IF NEW.cefr_level IS DISTINCT FROM OLD.cefr_level AND OLD.cefr_level_source IN ('placement', 'checkpoint') THEN
      NEW.cefr_level_source := 'manual';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- CEFR level and provenance are server-authoritative. Authenticated users can
-- still create and maintain their own profile details, but never supply or
-- alter these columns directly.
REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
GRANT SELECT (id, created_at, display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests)
  ON TABLE public.user_profiles TO authenticated;
GRANT INSERT (id, display_name, interests)
  ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE (display_name, interests)
  ON TABLE public.user_profiles TO authenticated;
GRANT SELECT (id, created_at, display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests)
  ON TABLE public.user_profiles TO anon;

-- Secure user_profiles against privilege escalation and separate privileged role storage.
-- 1. Create dedicated user_roles table isolated from client access.
-- 2. Restrict user_profiles write permissions to display_name, cefr_level, and interests.
-- 3. Install BEFORE INSERT/UPDATE trigger to block elevation of role and storage_used_kb.
-- 4. Update authorization policies to use public.is_admin() referencing app_metadata and user_roles.

-- -----------------------------------------------------------------------------
-- 1. Dedicated user_roles table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_roles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO service_role;

DROP POLICY IF EXISTS "user_roles_no_client_access" ON public.user_roles;
CREATE POLICY "user_roles_no_client_access"
ON public.user_roles
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- CRITICAL: Do NOT backfill public.user_roles from user_profiles.role.
-- That column was previously client-writable, so any prior self-assigned
-- `admin` values are untrusted and must not be legitimized automatically.
-- Seed legitimate administrators only after an out-of-band audit, e.g.:
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<audited-user-uuid>', 'admin')
--   ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
-- Or set auth.users.raw_app_meta_data.role = 'admin' via the service role.
-- See docs/deployment/supabase-auth.md § Administrator seeding.

-- -----------------------------------------------------------------------------
-- 2. Public helper function for admin authorization
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Update dependent RLS policies and functions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.text_fragments_within_limit()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR (SELECT count(*) FROM public.text_fragments tf WHERE tf.user_id = auth.uid()) < 10;
$$;

REVOKE ALL ON FUNCTION public.text_fragments_within_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.text_fragments_within_limit() TO authenticated, service_role;

-- decks / ai_prompts may be absent on some remotes (ai_prompts was retired in
-- 20260718012728). Only rewrite their insert policies when the table exists.
DO $$
BEGIN
  IF to_regclass('public.decks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Insert deck with limit" ON public.decks';
    EXECUTE $policy$
      CREATE POLICY "Insert deck with limit"
      ON public.decks
      FOR INSERT
      TO authenticated
      WITH CHECK (
        public.is_admin()
        OR (
          SELECT count(*)
          FROM public.decks decks_1
          WHERE decks_1.user_id = auth.uid()
            AND decks_1.is_system = false
        ) < 5
      )
    $policy$;
  END IF;

  IF to_regclass('public.ai_prompts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Insert prompt with limit" ON public.ai_prompts';
    EXECUTE $policy$
      CREATE POLICY "Insert prompt with limit"
      ON public.ai_prompts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND (
          public.is_admin()
          OR (
            SELECT count(*)
            FROM public.ai_prompts ai_prompts_1
            WHERE ai_prompts_1.user_id = auth.uid()
          ) < 15
        )
      )
    $policy$;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Harden user_profiles table grants and policies
-- -----------------------------------------------------------------------------
REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;

-- Column-level grants for authenticated users
GRANT SELECT (id, created_at, display_name, cefr_level, interests) ON TABLE public.user_profiles TO authenticated;
GRANT INSERT (id, display_name, cefr_level, interests) ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE (display_name, cefr_level, interests) ON TABLE public.user_profiles TO authenticated;

-- Column-level grant for anon (read-only for own profile if needed)
GRANT SELECT (id, created_at, display_name, cefr_level, interests) ON TABLE public.user_profiles TO anon;

-- Trigger to guard privileged columns against self-assignment or modification
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
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.role := OLD.role;
    NEW.storage_used_kb := OLD.storage_used_kb;
    NEW.id := OLD.id;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_user_profiles_privileged_columns() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.protect_user_profiles_privileged_columns() TO authenticated, service_role;

DROP TRIGGER IF EXISTS tr_protect_user_profiles_privileged_columns ON public.user_profiles;
CREATE TRIGGER tr_protect_user_profiles_privileged_columns
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_profiles_privileged_columns();

-- Ensure RLS policies remain in place
DROP POLICY IF EXISTS "Read own profile" ON public.user_profiles;
CREATE POLICY "Read own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Update own profile" ON public.user_profiles;
CREATE POLICY "Update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

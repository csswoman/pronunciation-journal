-- Remove the premium role from app logic and make admin the only elevated role.
-- Also start new profiles at A1 instead of B1.

ALTER TABLE user_profiles
ALTER COLUMN cefr_level SET DEFAULT 'A1';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_sound_progress (user_id, sound_id, status)
  select
    new.id,
    s.id,
    case when row_number() over (order by s.id) <= 5
         then 'available'
         else 'locked'
    end
  from public.sounds s
  on conflict (user_id, sound_id) do nothing;

  return new;
end;
$$;

DROP POLICY IF EXISTS "Insert deck with limit" ON public.decks;
CREATE POLICY "Insert deck with limit"
ON public.decks
FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT user_profiles.role
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
  OR (
    SELECT count(*)
    FROM public.decks decks_1
    WHERE decks_1.user_id = auth.uid()
      AND decks_1.is_system = false
  ) < 5
);

DROP POLICY IF EXISTS "Insert prompt with limit" ON public.ai_prompts;
CREATE POLICY "Insert prompt with limit"
ON public.ai_prompts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (
      SELECT user_profiles.role
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
    OR (
      SELECT count(*)
      FROM public.ai_prompts ai_prompts_1
      WHERE ai_prompts_1.user_id = auth.uid()
    ) < 15
  )
);

DROP POLICY IF EXISTS "Manage own fragments" ON public.text_fragments;
CREATE POLICY "Manage own fragments"
ON public.text_fragments
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND (
    (
      SELECT user_profiles.role
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
    OR (
      SELECT count(*)
      FROM public.text_fragments text_fragments_1
      WHERE text_fragments_1.user_id = auth.uid()
    ) < 10
  )
);

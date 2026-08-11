alter table public.user_contrast_progress
  add column if not exists adaptive_score numeric(5,4) not null default 0,
  add column if not exists observation_count integer not null default 0;

create table if not exists public.essential_word_contrast_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null,
  contrast_id text not null,
  weight numeric(3,2) not null check (weight > 0 and weight <= 1),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, attempt_id, contrast_id)
);
alter table public.essential_word_contrast_observations enable row level security;
create policy "users insert own essential contrast observations" on public.essential_word_contrast_observations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users read own essential contrast observations" on public.essential_word_contrast_observations for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.apply_essential_word_contrast_observation(
  p_attempt_id uuid, p_contrast_id text, p_weight numeric, p_is_correct boolean
) returns void language plpgsql security invoker as $$
declare v_user_id uuid := auth.uid(); v_inserted boolean;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  insert into public.essential_word_contrast_observations (user_id, attempt_id, contrast_id, weight, is_correct)
  values (v_user_id, p_attempt_id, p_contrast_id, p_weight, p_is_correct)
  on conflict (user_id, attempt_id, contrast_id) do nothing returning true into v_inserted;
  if not coalesce(v_inserted, false) then return; end if;
  insert into public.user_contrast_progress (user_id, contrast_id, adaptive_score, observation_count, total_attempts, correct_answers, streak, ease_factor, interval_days, mastery_pct, last_seen)
  values (v_user_id, p_contrast_id, (case when p_is_correct then 0 else p_weight end) * 0.3, 1, 1, (case when p_is_correct then 1 else 0 end), (case when p_is_correct then 1 else 0 end), 2.5, 1, (case when p_is_correct then 100 else 0 end), now())
  on conflict (user_id, contrast_id) do update set
    adaptive_score = user_contrast_progress.adaptive_score * 0.7 + (case when p_is_correct then 0 else excluded.adaptive_score / 0.3 end) * 0.3,
    observation_count = user_contrast_progress.observation_count + 1,
    total_attempts = user_contrast_progress.total_attempts + 1,
    correct_answers = user_contrast_progress.correct_answers + (case when p_is_correct then 1 else 0 end),
    last_seen = now();
end $$;

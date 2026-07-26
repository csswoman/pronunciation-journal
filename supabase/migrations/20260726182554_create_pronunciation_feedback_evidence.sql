-- Plan 069: minimal, user-scoped pronunciation feedback evidence. No audio or
-- raw transcript is retained; the row is an idempotent offline-first mirror.
create table if not exists public.pronunciation_feedback_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id text not null,
  evaluator_kind text not null check (evaluator_kind in ('stt_intelligibility', 'transcript_phoneme_inference')),
  evaluator_version text not null,
  outcome text not null check (outcome in ('improved', 'same', 'needs_more_evidence', 'unscored')),
  attempt_pair_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists pronunciation_feedback_evidence_user_target_occurred_idx
  on public.pronunciation_feedback_evidence (user_id, target_id, occurred_at desc);

alter table public.pronunciation_feedback_evidence enable row level security;
grant select, insert, delete on public.pronunciation_feedback_evidence to authenticated;

create policy "pronunciation_feedback_evidence_select_own"
  on public.pronunciation_feedback_evidence for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pronunciation_feedback_evidence_insert_own"
  on public.pronunciation_feedback_evidence for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pronunciation_feedback_evidence_delete_own"
  on public.pronunciation_feedback_evidence for delete to authenticated
  using ((select auth.uid()) = user_id);

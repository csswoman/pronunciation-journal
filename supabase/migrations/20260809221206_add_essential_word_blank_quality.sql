create table public.essential_word_blank_quality (
  sentence_id text not null,
  token_index integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  guessed_at timestamptz not null default now(),
  primary key (sentence_id, token_index, user_id)
);
alter table public.essential_word_blank_quality enable row level security;
create policy "users insert own blank quality signal" on public.essential_word_blank_quality for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users read own blank quality signal" on public.essential_word_blank_quality for select to authenticated using ((select auth.uid()) = user_id);

create view public.essential_word_blank_review_queue with (security_invoker = true) as
select sentence_id, token_index, count(*)::integer as distinct_guess_users, 'retired_for_review'::text as status
from public.essential_word_blank_quality
group by sentence_id, token_index
having count(*) >= 3;

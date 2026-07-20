create or replace function public.is_valid_interest_list(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and jsonb_array_length(value) <= 10
    and not exists (
      select 1
      from jsonb_array_elements(value) as element
      where jsonb_typeof(element) <> 'string'
         or length(element #>> '{}') not between 1 and 40
    );
$$;

alter table public.user_profiles
  add column if not exists interests jsonb not null default '[]'::jsonb;

alter table public.user_profiles
  drop constraint if exists user_profiles_interests_valid;

alter table public.user_profiles
  add constraint user_profiles_interests_valid
  check (public.is_valid_interest_list(interests));

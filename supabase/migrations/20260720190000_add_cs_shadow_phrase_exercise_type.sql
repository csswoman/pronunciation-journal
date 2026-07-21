do $$
begin
  if exists (select 1 from public.exercise_types where id = 23 and slug <> 'cs_shadow_phrase')
    or exists (select 1 from public.exercise_types where slug = 'cs_shadow_phrase' and id <> 23) then
    raise exception 'Cannot seed cs_shadow_phrase: ID 23 or slug is already assigned differently';
  end if;
end $$;

insert into public.exercise_types (id, slug, label)
values (23, 'cs_shadow_phrase', 'Connected-speech shadow phrase')
on conflict do nothing;

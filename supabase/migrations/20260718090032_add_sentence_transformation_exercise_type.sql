do $$
begin
  if exists (select 1 from public.exercise_types where id = 20 and slug <> 'sentence_transformation')
    or exists (select 1 from public.exercise_types where slug = 'sentence_transformation' and id <> 20) then
    raise exception 'Cannot seed sentence_transformation: ID 20 or slug is already assigned differently';
  end if;
end $$;

insert into public.exercise_types (id, slug, label)
values (20, 'sentence_transformation', 'Sentence transformation')
on conflict do nothing;

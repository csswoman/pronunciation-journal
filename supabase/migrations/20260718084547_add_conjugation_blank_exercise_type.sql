do $$
begin
  if exists (select 1 from public.exercise_types where id = 21 and slug <> 'conjugation_blank')
    or exists (select 1 from public.exercise_types where slug = 'conjugation_blank' and id <> 21) then
    raise exception 'Cannot seed conjugation_blank: ID 21 or slug is already assigned differently';
  end if;
end $$;

insert into public.exercise_types (id, slug, label)
values (21, 'conjugation_blank', 'Conjugation blank')
on conflict do nothing;

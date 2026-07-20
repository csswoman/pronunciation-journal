do $$
begin
  if exists (select 1 from public.exercise_types where id = 22 and slug <> 'translation_es_en')
    or exists (select 1 from public.exercise_types where slug = 'translation_es_en' and id <> 22) then
    raise exception 'Cannot seed translation_es_en: ID 22 or slug is already assigned differently';
  end if;
end $$;

insert into public.exercise_types (id, slug, label)
values (22, 'translation_es_en', 'Spanish to English translation')
on conflict do nothing;

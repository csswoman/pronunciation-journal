do $$
begin
  if exists (select 1 from public.exercise_types where id = 19 and slug <> 'error_correction')
    or exists (select 1 from public.exercise_types where slug = 'error_correction' and id <> 19) then
    raise exception 'Cannot seed error_correction: ID 19 or slug is already assigned differently';
  end if;
end $$;

insert into public.exercise_types (id, slug, label)
values (19, 'error_correction', 'Error correction')
on conflict do nothing;

-- English Journal: entradas por usuario + audio en Storage
-- Ejecutar con: npx supabase db push --linked (o SQL Editor en dashboard)

create table if not exists public.entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  word text not null,
  ipa text,
  audio_url text,
  user_audio_url text,
  notes text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  tags text[] default '{}',
  meanings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists entries_user_id_created_at_idx
  on public.entries (user_id, created_at desc);

alter table public.entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'entries' and policyname = 'entries_select_own'
  ) then
    create policy "entries_select_own"
      on public.entries for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'entries' and policyname = 'entries_insert_own'
  ) then
    create policy "entries_insert_own"
      on public.entries for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'entries' and policyname = 'entries_update_own'
  ) then
    create policy "entries_update_own"
      on public.entries for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'entries' and policyname = 'entries_delete_own'
  ) then
    create policy "entries_delete_own"
      on public.entries for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- Bucket para audio de usuario
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-audio',
  'user-audio',
  true,
  10485760,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
on conflict (id) do nothing;

-- Politicas de Storage: cada usuario gestiona solo su carpeta auth.uid()/...
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_audio_select_own'
  ) then
    create policy "user_audio_select_own"
      on storage.objects for select
      using (
        bucket_id = 'user-audio'
        and auth.uid() is not null
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_audio_insert_own'
  ) then
    create policy "user_audio_insert_own"
      on storage.objects for insert
      with check (
        bucket_id = 'user-audio'
        and auth.uid() is not null
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_audio_update_own'
  ) then
    create policy "user_audio_update_own"
      on storage.objects for update
      using (
        bucket_id = 'user-audio'
        and auth.uid() is not null
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'user-audio'
        and auth.uid() is not null
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_audio_delete_own'
  ) then
    create policy "user_audio_delete_own"
      on storage.objects for delete
      using (
        bucket_id = 'user-audio'
        and auth.uid() is not null
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

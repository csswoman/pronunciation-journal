-- Add audio_url column to reader_passages for high-fidelity TTS playback
alter table public.reader_passages
  add column if not exists audio_url text;

-- Bucket for reader audio generation (10 MB limit, audio MIME types)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'reader-audio',
    'reader-audio',
    true,
    10485760, -- 10 MB
    array['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm']::text[]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies for reader-audio: public read, user-isolated writes
drop policy if exists "reader_audio_select_public" on storage.objects;
create policy "reader_audio_select_public"
on storage.objects
for select
using (bucket_id = 'reader-audio');

drop policy if exists "reader_audio_insert_own" on storage.objects;
create policy "reader_audio_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'reader-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

drop policy if exists "reader_audio_update_own" on storage.objects;
create policy "reader_audio_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'reader-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
)
with check (
  bucket_id = 'reader-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

drop policy if exists "reader_audio_delete_own" on storage.objects;
create policy "reader_audio_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'reader-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

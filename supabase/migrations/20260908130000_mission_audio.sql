-- Bucket for mission audio generation (10 MB limit, audio MIME types)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'mission-audio',
    'mission-audio',
    true,
    10485760, -- 10 MB
    array['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm']::text[]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies for mission-audio: public read, authenticated writes
drop policy if exists "mission_audio_select_public" on storage.objects;
create policy "mission_audio_select_public"
on storage.objects
for select
using (bucket_id = 'mission-audio');

drop policy if exists "mission_audio_insert_authenticated" on storage.objects;
create policy "mission_audio_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mission-audio'
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

drop policy if exists "mission_audio_update_authenticated" on storage.objects;
create policy "mission_audio_update_authenticated"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mission-audio'
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
)
with check (
  bucket_id = 'mission-audio'
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

drop policy if exists "mission_audio_delete_authenticated" on storage.objects;
create policy "mission_audio_delete_authenticated"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mission-audio'
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

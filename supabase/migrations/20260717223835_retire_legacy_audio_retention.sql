alter table public.entries
  drop column if exists keep_permanent,
  drop column if exists user_audio_url;

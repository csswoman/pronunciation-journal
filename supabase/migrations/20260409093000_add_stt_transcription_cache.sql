create table if not exists public.stt_transcription_cache (
  cache_key text primary key,
  target_word text,
  mime_type text not null,
  transcript text not null,
  payload_size integer not null default 0,
  hit_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stt_transcription_cache_updated_at_idx
  on public.stt_transcription_cache (updated_at desc);

drop trigger if exists stt_transcription_cache_updated_at on public.stt_transcription_cache;
create trigger stt_transcription_cache_updated_at
before update on public.stt_transcription_cache
for each row execute function public.update_updated_at();

alter table public.stt_transcription_cache enable row level security;

revoke all on table public.stt_transcription_cache from anon, authenticated;
grant select, insert, update, delete on table public.stt_transcription_cache to service_role;

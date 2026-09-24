create table if not exists public.ai_response_cache (
  key text primary key,
  feature text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ai_response_cache enable row level security;
alter table public.ai_response_cache force row level security;
revoke all on public.ai_response_cache from public, anon, authenticated;
grant select, insert, update on public.ai_response_cache to service_role;
create policy "ai_response_cache_service_role_only"
  on public.ai_response_cache for all to service_role
  using (true) with check (true);

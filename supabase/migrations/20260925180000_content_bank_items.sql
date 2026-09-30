-- Plan 041: Content bank items for pregenerated exercises
create table if not exists public.content_bank_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('coach_exercise')),
  tool_name text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  topic_id text not null,
  payload jsonb not null,
  prompt_version text not null default 'v1',
  stem_hash text not null unique,
  quality_flags int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists content_bank_items_kind_level_topic_idx
  on public.content_bank_items (kind, level, topic_id);

alter table public.content_bank_items enable row level security;
alter table public.content_bank_items force row level security;

revoke all on public.content_bank_items from public, anon;
grant select on public.content_bank_items to authenticated;
grant all on public.content_bank_items to service_role;

create policy "content_bank_items_select_authenticated"
  on public.content_bank_items for select
  to authenticated
  using (quality_flags < 3);

create policy "content_bank_items_service_role_all"
  on public.content_bank_items for all
  to service_role
  using (true) with check (true);

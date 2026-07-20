create table if not exists public.tracked_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('phrase', 'lesson')),
  ref        text not null,
  title      text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);

create index if not exists tracked_items_user_kind_idx
  on public.tracked_items (user_id, kind);

drop trigger if exists tracked_items_updated_at on public.tracked_items;
create trigger tracked_items_updated_at
  before update on public.tracked_items
  for each row execute function public.update_updated_at();

alter table public.tracked_items enable row level security;

drop policy if exists "Manage own tracked items" on public.tracked_items;
create policy "Manage own tracked items"
  on public.tracked_items
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.tracked_items to authenticated;

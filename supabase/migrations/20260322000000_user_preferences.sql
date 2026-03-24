-- User Preferences: para guardar preferencias de tema, acento y perfil
-- Ejecutar con: npx supabase db push --linked

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  accent text not null check (accent in ('american', 'british', 'neutral')) default 'american',
  theme_mode text not null check (theme_mode in ('light', 'dark', 'auto')) default 'auto',
  accent_color text not null default '#FFB6C1',
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create index if not exists user_preferences_user_id_idx
  on public.user_preferences (user_id);

alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_prefs_select_own'
  ) then
    create policy "user_prefs_select_own"
      on public.user_preferences for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_prefs_insert_own'
  ) then
    create policy "user_prefs_insert_own"
      on public.user_preferences for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_prefs_update_own'
  ) then
    create policy "user_prefs_update_own"
      on public.user_preferences for update
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_prefs_delete_own'
  ) then
    create policy "user_prefs_delete_own"
      on public.user_preferences for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- Crear trigger para actualizar updated_at automáticamente
create or replace function public.update_user_preferences_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_preferences_timestamp on public.user_preferences;

create trigger update_user_preferences_timestamp
  before update on public.user_preferences
  for each row
  execute function public.update_user_preferences_timestamp();

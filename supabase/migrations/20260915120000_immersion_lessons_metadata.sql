-- Add metadata column to immersion_lessons to store canonical topic relation,
-- pedagogical reason, and assignment type (direct vs fallback).
alter table public.immersion_lessons
  add column if not exists metadata jsonb not null default '{}'::jsonb;

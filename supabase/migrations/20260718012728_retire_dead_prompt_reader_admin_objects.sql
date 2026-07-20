-- These prompt and reader tables have no runtime consumers. ai_prompts was
-- exported before this migration; the dependent favorites table is dropped first.
drop table if exists public.user_favorite_prompts;
drop table if exists public.ai_prompts;
drop table if exists public.reader_passages;

-- Retired APIs from the original pronunciation/admin implementations.
drop function if exists public.get_random_word(integer);
drop function if exists public.update_progress(integer, boolean);
drop function if exists public.is_admin();

-- El progreso distingue inicio, respuestas y formatos terminados por día.
-- La política RLS existente de focus_sprints sigue aislando cada fila por user_id.
ALTER TABLE public.focus_sprints
  ADD COLUMN IF NOT EXISTS practice_progress jsonb NOT NULL DEFAULT '{"days": []}'::jsonb;

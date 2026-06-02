-- Fase 5a: Migración al modelo de progreso por contraste.
--
-- Decisión de migración (documentada): DESCARTAR user_sound_progress.
-- El modelo cambia de "progreso por sonido" a "progreso por par confusable (contraste)".
-- La conversión 1:1 es ambigua (un sonido tiene N contrastes) y el historial viejo
-- aportaría ruido, no señal, al nuevo SRS. Para ~50 usuarios en una feature en rediseño,
-- empezar limpio es la opción correcta.

-- ─── DROP tabla vieja ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.user_sound_progress CASCADE;

-- ─── Nueva tabla: progreso por contraste ─────────────────────────────────────
CREATE TABLE public.user_contrast_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Clave canónica del contraste: "ipaA|ipaB" con ipaA <= ipaB (lexicográfico).
  -- Generada siempre via contrastKey() en lib/phoneme-practice/phoneme-similarity.ts.
  contrast_id   text NOT NULL,

  -- SRS
  ease_factor   double precision NOT NULL DEFAULT 2.5,
  interval_days integer          NOT NULL DEFAULT 1,
  next_review   timestamptz,
  last_seen     timestamptz,

  -- Contadores
  total_attempts  integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  streak          integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, contrast_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_contrast_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own contrast progress"
  ON public.user_contrast_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own contrast progress"
  ON public.user_contrast_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own contrast progress"
  ON public.user_contrast_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Índice de review ─────────────────────────────────────────────────────────
CREATE INDEX ON public.user_contrast_progress (user_id, next_review);

-- ─── updated_at automático ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_contrast_progress_updated_at
  BEFORE UPDATE ON public.user_contrast_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

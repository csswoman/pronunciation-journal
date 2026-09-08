-- Focus Mode: sprint de cierre de gap personal (opcional, independiente del Daily Plan).
-- El usuario activa un sprint de 7 días con 1-2 gaps concretos.
-- Gemini genera contenido de texto pedagógico; el usuario puede subir media desde el dashboard.

-- ── 1. focus_sprints ─────────────────────────────────────────────────────────
-- Un sprint activo por usuario. status: active | completed | expired.
-- gaps es un jsonb array de SprintGap: { kind, targetId, label, level }.

CREATE TABLE IF NOT EXISTS focus_sprints (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  gaps        jsonb NOT NULL DEFAULT '[]',
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz NOT NULL,
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'expired')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE focus_sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "focus_sprints_own"
  ON focus_sprints FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS focus_sprints_user_status
  ON focus_sprints (user_id, status);

-- ── 2. focus_content ──────────────────────────────────────────────────────────
-- Contenido de texto generado por Gemini para un sprint.
-- kind: story | drill | dialogue | error_trap | song
-- body: estructura jsonb según kind (StoryBody, DrillBody, etc.)
-- exercises: ExerciseSpec[] derivados automáticamente del body
-- URLs de media: opcionales, el usuario las actualiza desde el dashboard
--   de Supabase Storage (bucket focus-media) y pega la URL aquí.

CREATE TABLE IF NOT EXISTS focus_content (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id             uuid REFERENCES focus_sprints NOT NULL,
  user_id               uuid REFERENCES auth.users NOT NULL,
  kind                  text NOT NULL
                          CHECK (kind IN ('story', 'drill', 'dialogue', 'error_trap', 'song')),
  gap_ids               text[] NOT NULL DEFAULT '{}',
  body                  jsonb NOT NULL,
  exercises             jsonb NOT NULL DEFAULT '[]',
  -- media subida manualmente desde Supabase dashboard → bucket focus-media
  audio_narration_url   text,
  audio_sentences_urls  text[] NOT NULL DEFAULT '{}',
  image_scene_url       text,
  image_prompt_url      text,
  video_clip_url        text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE focus_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "focus_content_own"
  ON focus_content FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS focus_content_sprint
  ON focus_content (sprint_id, kind);

CREATE INDEX IF NOT EXISTS focus_content_user_created
  ON focus_content (user_id, created_at DESC);

-- ── 3. Storage bucket focus-media (público, solo lectura anónima) ─────────────
-- Subida manual desde el dashboard de Supabase.
-- Contenido del sistema: todo el mundo lo lee, nadie externo lo escribe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'focus-media',
  'focus-media',
  true,
  104857600, -- 100 MB
  ARRAY[
    'audio/ogg', 'audio/mpeg', 'audio/webm',
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (cualquiera puede ver la media del sistema)
DROP POLICY IF EXISTS "focus_media_select_public" ON storage.objects;
CREATE POLICY "focus_media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'focus-media');

-- Escritura solo desde el dashboard / service_role (no desde la app cliente)
-- No se crean políticas INSERT/UPDATE/DELETE para usuarios normales.
-- La subida la hace la creadora de la app directamente desde Supabase Studio.

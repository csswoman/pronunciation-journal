-- ── Theory Lessons ────────────────────────────────────────────────────────────
-- System lessons: user_id = NULL, is_system = true  (inserted from dashboard)
-- User lessons:   user_id = auth.uid(), is_system = false

CREATE TABLE IF NOT EXISTS "public"."theory_lessons" (
    "id"               uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "user_id"          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "title"            text NOT NULL,
    "slug"             text NOT NULL,
    "content"          text NOT NULL DEFAULT '',
    "category"         text NOT NULL DEFAULT 'general',
    "cover_image_url"  text,
    "is_published"     boolean NOT NULL DEFAULT false,
    "is_system"        boolean NOT NULL DEFAULT false,
    "created_at"       timestamptz NOT NULL DEFAULT now(),
    "updated_at"       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT theory_lessons_pkey PRIMARY KEY (id),
    -- slug must be unique per user (or globally for system lessons)
    CONSTRAINT theory_lessons_slug_user_unique UNIQUE NULLS NOT DISTINCT (slug, user_id)
);

ALTER TABLE "public"."theory_lessons" OWNER TO "postgres";

-- updated_at trigger (reuses the existing function)
CREATE TRIGGER "theory_lessons_updated_at"
    BEFORE UPDATE ON "public"."theory_lessons"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."theory_lessons" ENABLE ROW LEVEL SECURITY;

-- Read: own lessons + all published system lessons
CREATE POLICY "theory_lessons_select" ON "public"."theory_lessons"
    FOR SELECT USING (
        (user_id = auth.uid())
        OR (is_system = true AND is_published = true)
    );

-- Insert: authenticated users can create their own lessons only
CREATE POLICY "theory_lessons_insert" ON "public"."theory_lessons"
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND is_system = false
    );

-- Update: users can only update their own lessons
CREATE POLICY "theory_lessons_update" ON "public"."theory_lessons"
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid() AND is_system = false);

-- Delete: users can only delete their own lessons
CREATE POLICY "theory_lessons_delete" ON "public"."theory_lessons"
    FOR DELETE USING (user_id = auth.uid() AND is_system = false);

-- ── Storage bucket for lesson cover images ────────────────────────────────────
-- Run this in the Supabase dashboard if the bucket doesn't exist yet:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-covers', 'lesson-covers', true);

-- Storage RLS for lesson-covers bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "lesson_covers_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'lesson-covers'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "lesson_covers_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'lesson-covers');

CREATE POLICY "lesson_covers_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'lesson-covers'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

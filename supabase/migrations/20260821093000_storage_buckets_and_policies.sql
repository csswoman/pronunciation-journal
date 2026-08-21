-- Storage buckets and security policies for avatars and word-images.
-- All uploads/mutations are strictly namespaced by auth.uid().
-- Size limits and MIME types are enforced at the bucket level and by RLS policies.

-- 1. Upsert buckets with explicit size and MIME boundaries
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'word-images',
    'word-images',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Avatars policies (public read, permanent-user isolated writes)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Reject anonymous (guest) JWT sessions. coalesce(..., false) keeps permanent
-- users allowed when the claim is absent, while explicit is_anonymous=true fails.
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

-- 3. Word images policies (public read, permanent-user isolated writes)
DROP POLICY IF EXISTS "word_images_select" ON storage.objects;
CREATE POLICY "word_images_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'word-images');

DROP POLICY IF EXISTS "word_images_insert_own" ON storage.objects;
CREATE POLICY "word_images_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'word-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

DROP POLICY IF EXISTS "word_images_update_own" ON storage.objects;
CREATE POLICY "word_images_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'word-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
)
WITH CHECK (
  bucket_id = 'word-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

DROP POLICY IF EXISTS "word_images_delete_own" ON storage.objects;
CREATE POLICY "word_images_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'word-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

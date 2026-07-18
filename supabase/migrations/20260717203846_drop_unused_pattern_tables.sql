-- Pattern-based dynamic lessons were removed from the application in May 2026.
-- Drop the child table first so the foreign key to public.patterns is removed
-- without CASCADE and unknown dependencies still fail safely.

DROP TABLE IF EXISTS public.pattern_words;
DROP TABLE IF EXISTS public.patterns;

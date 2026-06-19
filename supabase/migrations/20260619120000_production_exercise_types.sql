-- Free production exercise types (online-only — AI grading via /api/gemini/grade-production)
INSERT INTO public.exercise_types (id, slug, label) VALUES
  (15, 'written_production', 'Written production'),
  (16, 'spoken_production',  'Spoken production')
ON CONFLICT (slug) DO NOTHING;

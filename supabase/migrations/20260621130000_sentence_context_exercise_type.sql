-- Sentence-context exercises are evaluated and must contribute to progress.
INSERT INTO public.exercise_types (id, slug, label) VALUES
  (18, 'sentence_context', 'Sentence context')
ON CONFLICT (slug) DO NOTHING;

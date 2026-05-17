-- Add generic exercise types for fill_blank, sentence_dictation, match_pairs, reorder_words
INSERT INTO public.exercise_types (id, slug, label) VALUES
  (5, 'fill_blank',          'Fill in the blank'),
  (6, 'sentence_dictation',  'Sentence dictation'),
  (7, 'match_pairs',         'Match pairs'),
  (8, 'reorder_words',       'Reorder words')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.exercise_types (id, slug, label) VALUES
  (1, 'pick_word',     'Pick the word'),
  (2, 'pick_sound',    'Pick the sound'),
  (3, 'minimal_pair',  'Minimal pair'),
  (4, 'dictation',     'Dictation')
ON CONFLICT (slug) DO NOTHING;

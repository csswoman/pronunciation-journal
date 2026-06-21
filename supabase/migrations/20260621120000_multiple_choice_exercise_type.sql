-- AI Coach multiple-choice widgets write to answer_history via savePracticeAnswer.
INSERT INTO public.exercise_types (id, slug, label) VALUES
  (17, 'multiple_choice', 'Multiple choice')
ON CONFLICT (slug) DO NOTHING;

-- Seed text_fragments for the biz-code-review grammar deck.
-- These sentences are used by the sentence_builder step in the daily plan.

insert into text_fragments (source, title, content, fragment_type) values
  ('grammar-deck:biz-code-review', 'Code Review English', 'It might be worth extracting this into a helper.',             'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I wonder if we could cache this result.',                      'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'Have you considered using a Map here?',                        'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'This could be simplified to a single reduce call.',            'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'Good catch — I hadn''t thought of that edge case.',            'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I went with a queue because it decouples the producer.',       'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'The trade-off here is simplicity versus performance.',         'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I can change it to a factory if that''s clearer.',             'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'You''re right, I''ll fix that in the next commit.',            'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'We can deploy to production once the tests pass.',             'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'If something breaks, we can roll back the change.',            'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I want to push back on the deadline — we need more time.',     'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I''ll address your comment before merging.',                   'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I''ve been working on the login flow — almost done.',          'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I''m blocked on the API rate limits — could use some help.',   'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I''ll take a look at your PR this morning.',                   'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'Let''s ship the feature behind a flag first.',                 'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'LGTM — nice and clean solution.',                              'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'I like how you separated concerns here.',                      'sentence'),
  ('grammar-deck:biz-code-review', 'Code Review English', 'One small nit: the variable name could be more descriptive.',  'sentence')
on conflict do nothing;

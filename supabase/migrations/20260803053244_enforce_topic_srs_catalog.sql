-- Keep the SRS boundary closed even when a new caller bypasses the shared
-- TypeScript writer. These are the canonical IDs from lib/topic-catalog.ts.
ALTER TABLE public.topic_srs
  DROP CONSTRAINT IF EXISTS topic_srs_topic_catalog_check;

ALTER TABLE public.topic_srs
  ADD CONSTRAINT topic_srs_topic_catalog_check
  CHECK (topic IN (
    'grammar:subject omission',
    'grammar:articles',
    'grammar:present simple',
    'grammar:past simple',
    'grammar:present continuous',
    'grammar:word order',
    'grammar:past continuous',
    'grammar:present perfect',
    'grammar:past perfect',
    'grammar:future simple',
    'grammar:going to',
    'grammar:conditionals',
    'grammar:prepositions',
    'grammar:modal verbs',
    'grammar:phrasal verbs',
    'grammar:comparatives',
    'grammar:superlatives',
    'grammar:questions',
    'grammar:question words',
    'grammar:pronouns',
    'grammar:quantifiers',
    'grammar:adjectives',
    'grammar:adverbs',
    'grammar:passive',
    'grammar:reported speech',
    'grammar:relative clauses',
    'vocab:vocabulary'
  ));

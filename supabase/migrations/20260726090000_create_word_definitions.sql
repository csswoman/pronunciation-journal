-- Shared, non-personal dictionary entries. Learning state remains in word_bank.
CREATE TABLE public.word_definitions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  text text NOT NULL,
  normalized_text text NOT NULL,
  meaning text NOT NULL,
  translation text NOT NULL,
  ipa text NOT NULL DEFAULT '',
  example text NOT NULL DEFAULT '',
  synonyms text[] NOT NULL DEFAULT '{}',
  image_prompt text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'gemini' CHECK (source IN ('gemini', 'curated')),
  definition_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT word_definitions_normalized_text_key UNIQUE (normalized_text)
);

CREATE TRIGGER word_definitions_updated_at
  BEFORE UPDATE ON public.word_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.word_definitions ENABLE ROW LEVEL SECURITY;

-- Entries are generic learning data, never a learner's context or progress.
CREATE POLICY word_definitions_authenticated_read ON public.word_definitions
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.word_definitions TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.word_definitions FROM anon, authenticated;


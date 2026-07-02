CREATE TABLE IF NOT EXISTS public.word_enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.word_bank(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.word_enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS word_enrichment_jobs_queue_idx
  ON public.word_enrichment_jobs (status, run_after, created_at)
  WHERE status IN ('queued', 'failed');

CREATE INDEX IF NOT EXISTS word_enrichment_jobs_word_idx
  ON public.word_enrichment_jobs (word_id, created_at DESC);

CREATE TRIGGER word_enrichment_jobs_updated_at
  BEFORE UPDATE ON public.word_enrichment_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "word_enrichment_jobs_select_own"
ON public.word_enrichment_jobs
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "word_enrichment_jobs_insert_own"
ON public.word_enrichment_jobs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

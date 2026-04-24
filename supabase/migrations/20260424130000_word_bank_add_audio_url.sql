-- Add audio_url column to word_bank for pronunciation audio
-- Uses Dictionary API as primary source, Web Speech API as fallback

ALTER TABLE public.word_bank
  ADD COLUMN IF NOT EXISTS audio_url text;

COMMENT ON COLUMN public.word_bank.audio_url IS 'Pronunciation audio URL from Dictionary API or other source. Fetched during enrichment.';

CREATE INDEX IF NOT EXISTS idx_word_bank_audio_url
  ON public.word_bank (audio_url) WHERE audio_url IS NOT NULL;

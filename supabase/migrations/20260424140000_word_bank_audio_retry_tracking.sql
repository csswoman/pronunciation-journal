-- Audio retry tracking and optimization
-- Prevents unnecessary retries for words without audio
-- Tracks failed fetch attempts for resilience

ALTER TABLE public.word_bank
  ADD COLUMN IF NOT EXISTS audio_fetch_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_audio boolean;

COMMENT ON COLUMN public.word_bank.audio_fetch_attempts IS 'Number of times we tried to fetch audio. Max 2, then we give up.';
COMMENT ON COLUMN public.word_bank.has_audio IS 'Cached result: does this word have audio? null=never tried, true=yes, false=no.';

CREATE INDEX IF NOT EXISTS idx_word_bank_has_audio_attempts
  ON public.word_bank (has_audio, audio_fetch_attempts)
  WHERE has_audio IS NULL OR audio_fetch_attempts < 2;

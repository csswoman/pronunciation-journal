-- Schema drift recovery: migration 20260701000000 was recorded as applied
-- but public.rate_limits / public.consume_rate_limit were missing remotely.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  window_start timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limits FROM anon, authenticated;

DROP POLICY IF EXISTS "rate_limits_no_client_access" ON public.rate_limits;
CREATE POLICY "rate_limits_no_client_access"
ON public.rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_max integer,
  p_window_ms integer
)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
  v_count integer;
  v_window_start timestamptz;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE insufficient_privilege USING MESSAGE = 'service role required';
  END IF;

  IF p_key IS NULL OR length(p_key) = 0 OR p_max < 1 OR p_window_ms < 1000 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  INSERT INTO public.rate_limits AS rl (key, count, window_start, updated_at)
  VALUES (p_key, 1, v_now, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN rl.window_start + v_window <= v_now THEN 1
      ELSE rl.count + 1
    END,
    window_start = CASE
      WHEN rl.window_start + v_window <= v_now THEN v_now
      ELSE rl.window_start
    END,
    updated_at = v_now
  RETURNING rl.count, rl.window_start
  INTO v_count, v_window_start;

  allowed := v_count <= p_max;
  retry_after_seconds := GREATEST(
    1,
    CEIL(EXTRACT(EPOCH FROM (v_window_start + v_window - v_now)))::integer
  );

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;;

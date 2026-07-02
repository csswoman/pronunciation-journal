-- RPC para reclamar jobs de enriquecimiento de forma atomica.
--
-- Usa SELECT ... FOR UPDATE SKIP LOCKED para evitar que dos workers
-- procesen el mismo job si se ejecutan en paralelo.
--
-- Parametros:
--   p_batch_size  Maximo de jobs a reclamar por llamada. Default: 3.
--   p_worker_id   Identificador del worker (para auditar locked_by). Default: 'cron'.
--
-- Retorna las filas actualizadas con status = 'running'.

CREATE OR REPLACE FUNCTION public.claim_enrichment_jobs(
  p_batch_size int DEFAULT 3,
  p_worker_id  text DEFAULT 'cron'
)
RETURNS SETOF public.word_enrichment_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.word_enrichment_jobs
  SET
    status     = 'running',
    locked_at  = now(),
    locked_by  = p_worker_id,
    updated_at = now()
  WHERE id IN (
    SELECT id
    FROM   public.word_enrichment_jobs
    WHERE  status IN ('queued', 'failed')
      AND  attempts < 5
      AND  run_after <= now()
    ORDER BY created_at ASC
    LIMIT  p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- Solo service_role puede invocar este RPC.
REVOKE EXECUTE ON FUNCTION public.claim_enrichment_jobs FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_enrichment_jobs TO service_role;

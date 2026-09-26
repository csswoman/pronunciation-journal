'use client'

// Planned structure:
// <KokoroBench>
//   <KokoroBenchControls />  — run button, status
//   <KokoroBenchResults />   — measured latencies table
// </KokoroBench>
//
// Temporary dev-only page for Plan 039 fase A3 (measure Kokoro TTS latency in
// a real browser before deciding whether to build the production worker
// pipeline). Talks to `lib/speech/kokoro/kokoro-worker.ts` directly via
// postMessage — no production code depends on this component.

import { useCallback, useRef, useState } from 'react'
import type { KokoroWorkerRequest, KokoroWorkerResponse } from '@/lib/speech/kokoro/types'

interface Measurement {
  label: string
  ms: number
}

export function KokoroBench() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../../lib/speech/kokoro/kokoro-worker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return workerRef.current
  }, [])

  const generate = useCallback(
    (text: string, voiceId: string) =>
      new Promise<number>((resolve, reject) => {
        const worker = getWorker()
        const requestId = crypto.randomUUID()
        const t0 = performance.now()
        const onMessage = (event: MessageEvent<KokoroWorkerResponse>) => {
          const data = event.data
          if (data.type === 'result' && data.requestId === requestId) {
            worker.removeEventListener('message', onMessage)
            resolve(performance.now() - t0)
          } else if (data.type === 'error' && (data.requestId === requestId || !data.requestId)) {
            worker.removeEventListener('message', onMessage)
            reject(new Error(data.error))
          }
        }
        worker.addEventListener('message', onMessage)
        const req: KokoroWorkerRequest = { type: 'generate', requestId, text, voiceId }
        worker.postMessage(req)
      }),
    [getWorker]
  )

  const load = useCallback(
    () =>
      new Promise<number>((resolve, reject) => {
        const worker = getWorker()
        const t0 = performance.now()
        const onMessage = (event: MessageEvent<KokoroWorkerResponse>) => {
          const data = event.data
          if (data.type === 'ready') {
            worker.removeEventListener('message', onMessage)
            resolve(performance.now() - t0)
          } else if (data.type === 'error') {
            worker.removeEventListener('message', onMessage)
            reject(new Error(data.error))
          }
        }
        worker.addEventListener('message', onMessage)
        const req: KokoroWorkerRequest = { type: 'load' }
        worker.postMessage(req)
      }),
    [getWorker]
  )

  const runBenchmark = useCallback(async () => {
    setStatus('loading')
    setError(null)
    setMeasurements([])
    try {
      const loadMs = await load()
      setMeasurements((prev) => [...prev, { label: 'Model load', ms: loadMs }])
      setStatus('running')

      const wordMs = await generate('ship', 'af_heart')
      setMeasurements((prev) => [...prev, { label: 'Single word ("ship")', ms: wordMs }])

      const wordMs2 = await generate('sheep', 'af_heart')
      setMeasurements((prev) => [...prev, { label: 'Single word, warm ("sheep")', ms: wordMs2 }])

      const phraseMs = await generate('The quick brown fox jumps over the lazy dog today', 'af_heart')
      setMeasurements((prev) => [...prev, { label: '8-word phrase', ms: phraseMs }])

      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }, [load, generate])

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="text-xl font-bold text-fg">Kokoro Bench (dev only)</h1>
        <p className="text-sm text-fg-muted">
          Mide la latencia real de Kokoro TTS en este navegador (device=&quot;wasm&quot;, dtype=&quot;q8&quot;).
          Descarga el modelo (~92 MB) desde Hugging Face la primera vez.
        </p>
      </div>

      <button
        type="button"
        onClick={runBenchmark}
        disabled={status === 'loading' || status === 'running'}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {status === 'loading' ? 'Descargando modelo…' : status === 'running' ? 'Generando…' : 'Ejecutar benchmark'}
      </button>

      {error && <p className="text-sm text-red-500">Error: {error}</p>}

      {measurements.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-fg-muted">
              <th className="py-1">Medición</th>
              <th className="py-1 text-right">ms</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => (
              <tr key={m.label} className="border-b border-[var(--border)]">
                <td className="py-1 text-fg">{m.label}</td>
                <td className="py-1 text-right font-mono text-fg">{m.ms.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

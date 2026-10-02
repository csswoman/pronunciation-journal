/** Durations only: never log audio, learner text or cache keys. */
export function createAiTiming(endpoint: string) {
  const startedAt = performance.now()
  const stages: Record<string, number> = {}
  return {
    async measure<T>(stage: string, work: () => Promise<T>): Promise<T> {
      const start = performance.now()
      try { return await work() }
      finally { stages[stage] = Math.round(performance.now() - start) }
    },
    headers(source: string): HeadersInit {
      stages.total = Math.round(performance.now() - startedAt)
      console.info('[AI timing]', { endpoint, source, ...stages })
      return { 'Server-Timing': Object.entries(stages).map(([name, ms]) => `${name};dur=${ms}`).join(', ') }
    },
  }
}

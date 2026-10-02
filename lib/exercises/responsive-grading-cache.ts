import type { GradingPipelineDeps } from './grading-pipeline'
import type { ProductionGradeResult } from './production-grade'

/** Per-hook cache: publishes before optional durable cache I/O, scoped to the user. */
export function createResponsiveGradingDeps(durable: GradingPipelineDeps): GradingPipelineDeps {
  const results = new Map<string, ProductionGradeResult>()
  return {
    gradeProduction: durable.gradeProduction,
    async isAccepted(...args) {
      try { return await durable.isAccepted(...args) }
      catch { return false }
    },
    async getCached(key) {
      const local = results.get(key)
      if (local) return local
      try { return await durable.getCached(key) }
      catch { return undefined }
    },
    async save(record) {
      if (results.size >= 100) results.delete(results.keys().next().value!)
      results.set(record.key, record.result)
      // This is a reusable grading cache, not answer history, outbox or SRS.
      void durable.save(record).catch(() => console.warn('[Grading cache] Write failed'))
    },
  }
}

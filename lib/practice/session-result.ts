import type { ExerciseResult, SessionResult } from './types'

function emptyBySlug(): SessionResult['bySlug'] {
  return {} as SessionResult['bySlug']
}

export function buildSessionResult(results: ExerciseResult[]): SessionResult {
  const total = results.length
  const correct = results.filter((r) => r.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalTimeMs = results.reduce((acc, r) => acc + r.timeMs, 0)
  const bySlug = emptyBySlug()
  for (const r of results) {
    const entry = bySlug[r.slug] ?? { total: 0, correct: 0 }
    entry.total += 1
    if (r.isCorrect) entry.correct += 1
    bySlug[r.slug] = entry
  }
  return { results, accuracy, totalTimeMs, bySlug }
}

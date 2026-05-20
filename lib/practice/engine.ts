import type {
  ExerciseSlug,
  PracticeConfig,
  PracticeExercise,
} from './types'

const DEFAULT_SESSION_LENGTH = 5

/**
 * Pick a random element from `arr`. Pure given a deterministic RNG, but in
 * Phase A we rely on `Math.random()` directly per spec.
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Select the next exercise to present.
 *
 * - Filters out anything whose id is already in `completedIds`.
 * - Avoids returning the same slug as the most recent entry in `completedSlugs`.
 * - Returns `null` when nothing is left.
 *
 * Pure: no DB, no Date, no side effects.
 */
export function selectNextExercise(
  available: PracticeExercise[],
  completedSlugs: ExerciseSlug[],
  completedIds: Set<string> = new Set(),
): PracticeExercise | null {
  const remaining = available.filter((ex) => !completedIds.has(ex.id))
  if (remaining.length === 0) return null

  const lastSlug = completedSlugs[completedSlugs.length - 1]
  const nonRepeating = lastSlug
    ? remaining.filter((ex) => ex.slug !== lastSlug)
    : remaining

  // If avoiding the last slug would leave us empty, fall back to remaining.
  const pool = nonRepeating.length > 0 ? nonRepeating : remaining
  return pickRandom(pool)
}

/**
 * Build a practice session from a configured pool.
 *
 * - Picks `config.sessionLength` exercises (default 5).
 * - Never repeats the same `contentId` within the session.
 * - Never repeats the same `slug` two times in a row.
 * - If fewer exercises are available than requested, returns what we have.
 *
 * Pure: no DB, no Date, no side effects.
 */
export function buildSession(config: PracticeConfig): PracticeExercise[] {
  const target = config.sessionLength ?? DEFAULT_SESSION_LENGTH
  const selected: PracticeExercise[] = []
  const usedContentIds = new Set<string>()
  const usedIds = new Set<string>()

  while (selected.length < target) {
    const pool = config.exercises.filter(
      (ex) => !usedIds.has(ex.id) && !usedContentIds.has(ex.contentId),
    )
    if (pool.length === 0) break

    const lastSlug = selected[selected.length - 1]?.slug
    const nonRepeating = lastSlug ? pool.filter((ex) => ex.slug !== lastSlug) : pool
    const finalPool = nonRepeating.length > 0 ? nonRepeating : pool

    const next = pickRandom(finalPool)
    selected.push(next)
    usedIds.add(next.id)
    usedContentIds.add(next.contentId)
  }

  return selected
}

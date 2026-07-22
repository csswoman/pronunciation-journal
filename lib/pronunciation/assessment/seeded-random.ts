/**
 * Deterministic PRNG for pronunciation diagnostic prompt selection (plan
 * 067, step 3). Never use `Math.random()` on the selection path — the same
 * seed must always produce the same selection, for reproducible tests and
 * stable product behavior.
 *
 * mulberry32: small, fast, well-distributed enough for weighted sampling of
 * ~11 items. Not cryptographically secure — not needed here.
 */

/** Converts a string seed to a 32-bit unsigned int via a simple FNV-1a hash. */
export function hashSeedToUint32(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** A seeded pseudo-random number generator producing floats in [0, 1). */
export type SeededRng = () => number

/** Builds a mulberry32 generator from a numeric or string seed. Deterministic: same seed → same sequence. */
export function createSeededRng(seed: number | string): SeededRng {
  let state = (typeof seed === 'string' ? hashSeedToUint32(seed) : seed >>> 0) >>> 0

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Weighted sample without replacement. Consumes `rng` deterministically.
 * `count` is clamped to `items.length`. Weights must be positive; items with
 * weight <= 0 are treated as weight `minWeight` (a small positive floor) so
 * they remain reachable over many seeds rather than permanently excluded.
 */
export function weightedSampleWithoutReplacement<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  count: number,
  rng: SeededRng,
  minWeight = 0.0001
): T[] {
  const pool = items.map((item) => ({ item, weight: Math.max(weightOf(item), minWeight) }))
  const picked: T[] = []
  const target = Math.min(count, pool.length)

  while (picked.length < target && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
    let roll = rng() * total
    let index = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight
      if (roll <= 0) {
        index = i
        break
      }
    }
    picked.push(pool[index].item)
    pool.splice(index, 1)
  }

  return picked
}

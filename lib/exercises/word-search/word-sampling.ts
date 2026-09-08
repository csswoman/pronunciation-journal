import { sanitizeWord } from './grid-generator'

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

/**
 * Selects `count` unique items from a pool, prioritizing items that have not
 * been recently played to avoid repetition across games.
 */
export function pickUnrepeatedWords<T extends { word: string }>(
  pool: T[],
  count: number,
  recentWordKeys: Set<string>,
): T[] {
  // Deduplicate pool by sanitized word
  const uniquePool: T[] = []
  const seenInPool = new Set<string>()

  for (const item of pool) {
    const clean = sanitizeWord(item.word)
    if (clean.length >= 2 && !seenInPool.has(clean)) {
      seenInPool.add(clean)
      uniquePool.push(item)
    }
  }

  if (uniquePool.length <= count) {
    return shuffle(uniquePool)
  }

  // Partition into fresh (not recently seen) and used
  const fresh: T[] = []
  const used: T[] = []

  for (const item of uniquePool) {
    const clean = sanitizeWord(item.word)
    if (recentWordKeys.has(clean)) {
      used.push(item)
    } else {
      fresh.push(item)
    }
  }

  const shuffledFresh = shuffle(fresh)
  const shuffledUsed = shuffle(used)

  const selected = shuffledFresh.slice(0, count)

  // If not enough fresh words, fill remainder from used
  if (selected.length < count) {
    const remainingNeeded = count - selected.length
    selected.push(...shuffledUsed.slice(0, remainingNeeded))
  }

  return selected
}

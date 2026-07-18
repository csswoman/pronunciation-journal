/**
 * Stable, order- and case-independent hash of a target set. The same recycled
 * words always resolve to the same cache key. FNV-1a over the sorted,
 * lowercased, comma-joined targets.
 *
 * An optional CEFR `level` is folded into the key so the same word set graded at
 * a different level yields a distinct cache entry (a placed learner who levels
 * up gets a fresh passage instead of the stale one). Omitting `level` preserves
 * the original hash for backward compatibility.
 */
export function targetHash(targets: string[], level?: string): string {
  const words = targets.map((t) => t.trim().toLowerCase()).sort().join(',')
  const canonical = level ? `${words}|${level.toLowerCase()}` : words
  let h = 0x811c9dc5
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

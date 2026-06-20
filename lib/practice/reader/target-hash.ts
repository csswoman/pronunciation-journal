/**
 * Stable, order- and case-independent hash of a target set. Used as the cache
 * key for reader_passages (so the same set of recycled words resolves the same
 * passage). FNV-1a over the sorted, lowercased, comma-joined targets.
 */
export function targetHash(targets: string[]): string {
  const canonical = targets.map((t) => t.trim().toLowerCase()).sort().join(',')
  let h = 0x811c9dc5
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/** Merge weak + due words; weak entries win on id collision. */
export function mergeReviewWords<T extends { id: string }>(weak: T[], due: T[], limit: number): T[] {
  const map = new Map<string, T>()
  for (const w of due) map.set(w.id, w)
  for (const w of weak) map.set(w.id, w)
  return [...map.values()].slice(0, limit)
}

import type { EdCluster, EdDrillItem, UserEdClusterProgress } from './types'

export const MASTERY_ACCURACY = 0.95

export function selectNextItem(
  catalog: readonly EdDrillItem[],
  progressByCluster: ReadonlyMap<EdCluster, UserEdClusterProgress>,
): EdDrillItem | null {
  let nextItem: EdDrillItem | null = null
  let lowestAccuracy = Number.POSITIVE_INFINITY

  for (const item of catalog) {
    const progress = progressByCluster.get(item.cluster)
    if (progress && progress.accuracy >= MASTERY_ACCURACY) continue

    // Un cluster aún no visto tiene prioridad sobre cualquier resultado previo.
    const accuracy = progress?.accuracy ?? Number.NEGATIVE_INFINITY
    if (accuracy < lowestAccuracy) {
      lowestAccuracy = accuracy
      nextItem = item
    }
  }

  return nextItem
}

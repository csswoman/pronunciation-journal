import type { ItemSchedule } from './verification/types'

export interface EssentialProgressItem {
  wordId: string
  schedule: ItemSchedule
  suspended: boolean
}

export interface EssentialWordsProgressSummary {
  studiedWords: number
  dueWords: number
  dueItems: number
}

/**
 * Canonical Essential Words progress derived only from learning_items.schedule.
 * One word can own several skill items, so word and item counts stay explicit.
 */
export function summarizeEssentialWordsProgress(
  items: readonly EssentialProgressItem[],
  now: Date = new Date(),
  allowedWordIds?: ReadonlySet<string>,
): EssentialWordsProgressSummary {
  const studiedWordIds = new Set<string>()
  const dueWordIds = new Set<string>()
  let dueItems = 0
  const nowIso = now.toISOString()

  for (const item of items) {
    if (allowedWordIds && !allowedWordIds.has(item.wordId)) continue
    if (item.schedule.kind === 'none') continue

    studiedWordIds.add(item.wordId)
    if (!item.suspended && item.schedule.dueAt <= nowIso) {
      dueWordIds.add(item.wordId)
      dueItems++
    }
  }

  return {
    studiedWords: studiedWordIds.size,
    dueWords: dueWordIds.size,
    dueItems,
  }
}

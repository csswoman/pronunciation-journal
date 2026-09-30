import type { WordBankEntry } from '@/lib/word-bank/types'
import type { SoundDueHome } from '@/lib/home/constants'
import type { EssentialWordReviewItem, LessonReviewItem, TopicSrsRow } from './types'

export interface ReviewFilterOptions {
  sortByOverdue: boolean
  onlyOverdue: boolean
}

function daysOverdueFromDate(dateIso: string | null | undefined): number {
  if (!dateIso) return 0
  const due = new Date(dateIso)
  due.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000))
}

/** Real days overdue for a word_bank row — derived from its own `next_review_at`. */
export function wordDaysOverdue(word: Pick<WordBankEntry, 'next_review_at'>): number {
  return daysOverdueFromDate(word.next_review_at)
}

/** Real days overdue for a topic_srs row — derived from its own `next_review_at`. */
export function topicDaysOverdue(topic: Pick<TopicSrsRow, 'next_review_at'>): number {
  return daysOverdueFromDate(topic.next_review_at)
}

/** Real days overdue for a sound contrast — already computed server-side. */
export function soundDaysOverdue(sound: Pick<SoundDueHome, 'daysOverdue'>): number {
  return sound.daysOverdue
}

/** Real days overdue for a lesson pending review. */
export function lessonDaysOverdue(lesson: Pick<LessonReviewItem, 'dueAt'>): number {
  return daysOverdueFromDate(lesson.dueAt)
}

/** Real days overdue for an essential-word skill pending review. */
export function essentialWordDaysOverdue(item: Pick<EssentialWordReviewItem, 'dueAt'>): number {
  return daysOverdueFromDate(item.dueAt)
}

/**
 * Applies the shared "solo lo atrasado" / "ordenar por retraso" controls to a
 * list whose items carry a real due date. Never invents a date: items without
 * one (e.g. `getDaysOverdue` returning 0) are treated as not overdue.
 */
export function applyReviewFilters<T>(
  items: readonly T[],
  getDaysOverdue: (item: T) => number,
  options: ReviewFilterOptions,
): T[] {
  let result: T[] = options.onlyOverdue ? items.filter((item) => getDaysOverdue(item) > 0) : [...items]
  if (options.sortByOverdue) {
    result = result.sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a))
  }
  return result
}

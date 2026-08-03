import { TOPIC_CATALOG } from '@/lib/topic-catalog'

/** The subset of the canonical catalog that journal corrections may emit. */
export const JOURNAL_TOPIC_IDS = new Set<string>([
  'grammar:subject omission',
  'grammar:articles',
  'grammar:present simple',
  'grammar:past simple',
  'grammar:present continuous',
  'grammar:word order',
])

export const JOURNAL_TOPIC_CATALOG = TOPIC_CATALOG.filter(({ id }) => JOURNAL_TOPIC_IDS.has(id))

export type JournalTopicId = (typeof JOURNAL_TOPIC_CATALOG)[number]['id']

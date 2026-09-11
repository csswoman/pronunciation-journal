import { describe, it, expect } from 'vitest'
import {
  SELF_DIAGNOSIS_ITEMS,
  topicsFromSelection,
  selectionNeedsPhoneme,
} from '../self-diagnosis'
import { TOPIC_IDS } from '@/lib/topic-catalog'

describe('self-diagnosis catalog', () => {
  it('maps every situation to topics that exist in the catalog', () => {
    for (const item of SELF_DIAGNOSIS_ITEMS) {
      for (const topicId of item.topicIds) {
        expect(TOPIC_IDS.has(topicId), `${item.id} → ${topicId}`).toBe(true)
      }
    }
  })

  it('uses unique ids', () => {
    const ids = SELF_DIAGNOSIS_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('topicsFromSelection', () => {
  it('returns nothing for an empty selection', () => {
    expect(topicsFromSelection([])).toEqual([])
  })

  it('deduplicates topics shared by two situations', () => {
    const topics = topicsFromSelection(['telling-past', 'two-pasts'])
    expect(new Set(topics).size).toBe(topics.length)
    expect(topics).toContain('grammar:past simple')
  })

  it('ignores unknown ids', () => {
    expect(topicsFromSelection(['nope'])).toEqual([])
  })

  it('keeps the primary topic of a situation first', () => {
    expect(topicsFromSelection(['asking'])[0]).toBe('grammar:questions')
  })
})

describe('selectionNeedsPhoneme', () => {
  it('is true only for sound-based difficulties', () => {
    expect(selectionNeedsPhoneme(['similar-sounds'])).toBe(true)
    expect(selectionNeedsPhoneme(['telling-past'])).toBe(false)
    expect(selectionNeedsPhoneme([])).toBe(false)
  })
})

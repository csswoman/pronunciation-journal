import { describe, expect, it } from 'vitest'
import { canonicalTopic, TOPIC_CATALOG } from '@/lib/topic-catalog'
import { JOURNAL_TOPIC_IDS } from '@/lib/journal/topic-catalog'

describe('topic catalog', () => {
  it('contains only namespaced IDs', () => {
    expect(TOPIC_CATALOG.length).toBeGreaterThan(0)
    expect(TOPIC_CATALOG.every(({ id }) => id.includes(':'))).toBe(true)
  })

  it('canonicalizes known spellings to one persisted key', () => {
    expect(canonicalTopic('grammar:Present_Simple')).toBe('grammar:present simple')
    expect(canonicalTopic('grammar:present_simple_s')).toBe('grammar:present simple')
    expect(canonicalTopic('grammar:simple_past_tense')).toBe('grammar:past simple')
  })

  it('rejects bare, unknown, and unsupported namespaces', () => {
    expect(canonicalTopic('past_simple')).toBeNull()
    expect(canonicalTopic('grammar:not-in-catalog')).toBeNull()
    expect(canonicalTopic('sound:voiced')).toBeNull()
    expect(canonicalTopic('vocab:business')).toBeNull()
  })

  it('keeps journal topics as a subset of the global catalog', () => {
    for (const topic of JOURNAL_TOPIC_IDS) {
      expect(canonicalTopic(topic)).toBe(topic)
    }
  })
})

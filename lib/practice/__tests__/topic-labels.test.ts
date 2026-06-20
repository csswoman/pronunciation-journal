import { describe, expect, it } from 'vitest'
import { topicDisplayLabel } from '@/lib/practice/topic-labels'

describe('topicDisplayLabel', () => {
  it('maps a known grammar topic to a curated human label', () => {
    expect(topicDisplayLabel('grammar:present_simple')).toBe('Presente simple')
  })

  it('matches known topics regardless of separators or case', () => {
    expect(topicDisplayLabel('grammar:Present-Simple')).toBe('Presente simple')
    expect(topicDisplayLabel('  GRAMMAR:present   simple ')).toBe('Presente simple')
  })

  it('matches a known topic even without the domain prefix', () => {
    expect(topicDisplayLabel('present_simple')).toBe('Presente simple')
  })

  it('title-cases an unknown topic and drops the domain prefix', () => {
    expect(topicDisplayLabel('grammar:phrasal_verbs_of_movement')).toBe(
      'Phrasal verbs of movement',
    )
  })

  it('maps the generic vocabulary topic to a learner label', () => {
    expect(topicDisplayLabel('vocab:vocabulary')).toBe('Vocabulario')
  })

  it('returns null for empty or meaningless input', () => {
    expect(topicDisplayLabel('')).toBeNull()
    expect(topicDisplayLabel('   ')).toBeNull()
    expect(topicDisplayLabel(undefined)).toBeNull()
  })
})

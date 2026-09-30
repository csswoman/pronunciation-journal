import { describe, expect, it } from 'vitest'
import { TECH_CHUNKS } from '../data-tech'
import { LEARNING_CHUNKS } from '../catalog'
import { filterChunksForInterests } from '../queries'
import { formatChunkCategory } from '../categories'

const TECH_CATEGORIES = new Set([
  'Tech Interviews',
  'Selling Yourself',
  'Engineering Day-to-Day',
  'Design Critique',
  'Stakeholder Meetings',
])

describe('tech track chunks', () => {
  it('has exactly 100 chunks, one per category × 20, all marked track: tech', () => {
    expect(TECH_CHUNKS).toHaveLength(100)
    expect(new Set(TECH_CHUNKS.map((chunk) => chunk.id)).size).toBe(100)
    expect(TECH_CHUNKS.every((chunk) => chunk.track === 'tech')).toBe(true)

    const byCategory = TECH_CHUNKS.reduce<Record<string, number>>((acc, chunk) => {
      acc[chunk.category] = (acc[chunk.category] ?? 0) + 1
      return acc
    }, {})
    for (const category of TECH_CATEGORIES) expect(byCategory[category]).toBe(20)
  })

  it('has a Spanish label for every tech category', () => {
    for (const category of TECH_CATEGORIES) {
      expect(formatChunkCategory(category)).not.toBe(category)
    }
  })

  it('carries the same required fields as the general catalog', () => {
    for (const chunk of TECH_CHUNKS) {
      expect(chunk.chunk.trim()).not.toBe('')
      expect(chunk.ipa.trim()).not.toBe('')
      expect(chunk.meaning.trim()).not.toBe('')
      expect(chunk.example.trim()).not.toBe('')
      expect(chunk.example_translation?.trim()).not.toBe('')
      expect(chunk.example_dialogue).toHaveLength(2)
    }
  })

  it('merges into LEARNING_CHUNKS with resolved learning metadata', () => {
    const learned = LEARNING_CHUNKS.filter((chunk) => chunk.track === 'tech')
    expect(learned).toHaveLength(100)
    for (const chunk of learned) {
      expect(chunk.learning.practiceAnswer.trim()).not.toBe('')
      expect(chunk.learning.recognitionCueEs.trim()).not.toBe('')
      expect(chunk.learning.productionCueEs.trim()).not.toBe('')
    }
  })

  it('is excluded from selection unless the learner opted into technology/work interests', () => {
    expect(filterChunksForInterests(LEARNING_CHUNKS, null).some((c) => c.track === 'tech')).toBe(false)
    expect(filterChunksForInterests(LEARNING_CHUNKS, []).some((c) => c.track === 'tech')).toBe(false)
    expect(filterChunksForInterests(LEARNING_CHUNKS, ['travel', 'food']).some((c) => c.track === 'tech')).toBe(false)
    expect(filterChunksForInterests(LEARNING_CHUNKS, ['technology']).some((c) => c.track === 'tech')).toBe(true)
    expect(filterChunksForInterests(LEARNING_CHUNKS, ['work']).some((c) => c.track === 'tech')).toBe(true)
  })

  it('never drops general chunks when filtering by interest', () => {
    const generalCount = LEARNING_CHUNKS.filter((c) => c.track !== 'tech').length
    expect(filterChunksForInterests(LEARNING_CHUNKS, null)).toHaveLength(generalCount)
    expect(filterChunksForInterests(LEARNING_CHUNKS, ['technology'])).toHaveLength(LEARNING_CHUNKS.length)
  })
})

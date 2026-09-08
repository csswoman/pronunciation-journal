import { describe, expect, it } from 'vitest'
import { CURATED_PUZZLE_ITEMS, WORD_SEARCH_PRESETS } from '../presets'

describe('word-search curated presets', () => {
  it('only publishes themes backed by authored puzzle content', () => {
    for (const preset of WORD_SEARCH_PRESETS) {
      const items = CURATED_PUZZLE_ITEMS[preset.id]
      expect(items, `${preset.id} needs authored items`).toBeDefined()
      expect(items.length).toBeGreaterThanOrEqual(15)
      expect(items.every((item) => Boolean(item.ipa))).toBe(true)
    }
  })

  it('provides a generous pool of words extracted from project files', () => {
    expect(CURATED_PUZZLE_ITEMS['silent-letters'].length).toBeGreaterThanOrEqual(20)
    expect(CURATED_PUZZLE_ITEMS['workplace-tech'].length).toBeGreaterThanOrEqual(50)
  })
})

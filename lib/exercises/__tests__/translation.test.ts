import { describe, expect, it } from 'vitest'
import { isExactTranslation } from '../translation'

const exercise = { id: 'x', type: 'translation_es_en' as const, sourceRef: { source: 'text_fragments' as const, id: 'x' }, sourceEs: 'hola', referenceEn: "She's here.", acceptedAnswers: ['She is here.'] }
describe('isExactTranslation', () => {
  it('accepts punctuation and case variations only for explicit answers', () => expect(isExactTranslation(exercise, "she's HERE")).toBe(true))
  it('accepts an explicit alternate but not a merely similar answer', () => { expect(isExactTranslation(exercise, 'she is here')).toBe(true); expect(isExactTranslation(exercise, 'she is over here')).toBe(false) })
})

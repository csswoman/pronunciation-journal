import { describe, expect, it } from 'vitest'
import { ED_DRILL_CATALOG, TEMPORAL_ADVERB_BLOCKLIST } from '../catalog'

describe('ED_DRILL_CATALOG — invariante sintáctica', () => {
  const everySentence = ED_DRILL_CATALOG.flatMap((item) =>
    Object.values(item.environments).flatMap((env) => [
      { itemId: item.id, level: env.level, field: 'sentence', text: env.sentence },
      { itemId: item.id, level: env.level, field: 'contrastSentence', text: env.contrastSentence },
    ]),
  )

  it('ningún ítem contiene adverbios temporales que delaten el tiempo verbal', () => {
    const offenders = everySentence.filter(({ text }) =>
      TEMPORAL_ADVERB_BLOCKLIST.some((adv) =>
        new RegExp(`\\b${adv}\\b`, 'i').test(text),
      ),
    )
    expect(offenders).toEqual([])
  })

  it('cada ítem define los tres entornos', () => {
    for (const item of ED_DRILL_CATALOG) {
      expect(Object.keys(item.environments).sort()).toEqual(['1', '2', '3'])
    }
  })

  it('contrastSentence usa el verbo base y sentence el pasado', () => {
    for (const item of ED_DRILL_CATALOG) {
      for (const env of Object.values(item.environments)) {
        expect(env.sentence).toContain(item.pastVerb)
        expect(env.contrastSentence).toContain(item.baseVerb)
        expect(env.contrastSentence).not.toContain(item.pastVerb)
      }
    }
  })

  it('los ids son únicos', () => {
    const ids = ED_DRILL_CATALOG.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analyzePronunciationWord } from '@/lib/journal/pronunciation-assistant'

describe('analyzePronunciationWord', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws offline error when navigator is offline', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('navigator', { onLine: false })
    vi.stubGlobal('fetch', fetchSpy)

    await expect(analyzePronunciationWord('recipe')).rejects.toThrow(
      'Necesitas conexión a internet para analizar la pronunciación con IA.'
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns analysis result when fetch is successful', async () => {
    const mockResult = {
      wordOrPhrase: 'recipe',
      ipa: "/'rɛsəpi/",
      syllableStress: 'RE-ci-pe',
      suggestedReason: 'tricky_spelling',
      explanationEs: 'Tiene 3 sílabas y termina en /i/.',
    }
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      })
    )

    const result = await analyzePronunciationWord('recipe')
    expect(result).toEqual(mockResult)
  })
})

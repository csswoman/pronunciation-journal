import { describe, expect, it } from 'vitest'
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from '@/lib/daily/localize-step-copy'

describe('localizeDailyStepSubtitle', () => {
  it('rewrites English phoneme focus copy to Spanish', () => {
    expect(localizeDailyStepSubtitle("Practice the sound as in 'job'")).toBe(
      "Practica el sonido como en 'job'",
    )
    expect(localizeDailyStepSubtitle('Practice the sound as in “job”')).toBe(
      "Practica el sonido como en 'job'",
    )
    expect(localizeDailyStepSubtitle('Your sound to strengthen today')).toBe(
      'Tu sonido a reforzar hoy',
    )
  })

  it('rewrites English minimal pairs and listening copy', () => {
    expect(localizeDailyStepSubtitle('Tell /dʒ/ apart from similar sounds')).toBe(
      'Distingue /dʒ/ de sonidos parecidos',
    )
    expect(localizeDailyStepSubtitle('Dictation with new words')).toBe(
      'Dictado con palabras nuevas',
    )
  })

  it('leaves Spanish subtitles unchanged', () => {
    expect(localizeDailyStepSubtitle("Practica el sonido como en 'job'")).toBe(
      "Practica el sonido como en 'job'",
    )
    expect(localizeDailyStepSubtitle('Distingue /dʒ/ de sonidos parecidos')).toBe(
      'Distingue /dʒ/ de sonidos parecidos',
    )
  })
})

describe('localizeDailyStepTitle', () => {
  it('maps scaffolding titles to Spanish and keeps concept titles', () => {
    expect(localizeDailyStepTitle('New words')).toBe('Palabras nuevas')
    expect(localizeDailyStepTitle('Word review')).toBe('Repaso de palabras')
    expect(localizeDailyStepTitle('Sound')).toBe('Sound')
    expect(localizeDailyStepTitle('Minimal pairs')).toBe('Minimal pairs')
    expect(localizeDailyStepTitle('Listen and write')).toBe('Listen and write')
  })
})

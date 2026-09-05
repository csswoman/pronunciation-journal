import { describe, expect, it } from 'vitest'
import {
  localizeDailyPlanSubtitles,
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

describe('localizeDailyPlanSubtitles', () => {
  it('formats word_intro subtitles with target words even from cached plan copy', () => {
    const plan = {
      steps: [
        {
          kind: 'word_intro',
          title: 'Palabras nuevas',
          subtitle: '5 palabras nuevas para conocer hoy',
          featuredWords: ['apple', 'banana', 'cherry', 'date', 'elderberry'],
        },
      ],
    }

    const localized = localizeDailyPlanSubtitles(plan)
    expect(localized.steps[0].subtitle).toBe('apple, banana, cherry, date, elderberry · 5 palabras nuevas')
  })

  it('upgrades cached generic titles and re-sorts journal_entry to the end', () => {
    const plan = {
      steps: [
        {
          id: 'grammar_focus:1',
          kind: 'grammar_focus',
          title: 'Estructura del día',
          subtitle: 'Expresa estados pasados',
          grammarRule: { title: 'Was y Were en pasado' },
        },
        {
          id: 'phoneme_focus:1',
          kind: 'phoneme_focus',
          title: 'Práctica de sonido',
          subtitle: 'Lo confundes con /ɛ/',
          ipa: 'ɛ',
        },
        {
          id: 'study_deck:1',
          kind: 'study_deck',
          title: 'Estudia teoría',
          subtitle: 'Was y were en pasado',
        },
        {
          id: 'journal_entry',
          kind: 'concept',
          title: 'Escribe en tu diario',
          subtitle: 'Unas líneas y, si quieres, corrección',
        },
        {
          id: 'word_intro',
          kind: 'word_intro',
          title: 'Palabras nuevas',
          subtitle: '5 palabras nuevas para conocer hoy',
          featuredWords: ['was', 'were', 'yesterday'],
        },
      ],
    }

    const localized = localizeDailyPlanSubtitles(plan)
    expect(localized.steps.map((s) => s.id)).toEqual([
      'phoneme_focus:1',
      'study_deck:1',
      'grammar_focus:1',
      'word_intro',
      'journal_entry',
    ])
    expect(localized.steps[0].title).toBe('Práctica del sonido /ɛ/')
    expect(localized.steps[1].title).toBe('Teoría: Was y were en pasado')
    expect(localized.steps[2].title).toBe('Estructura: Was y Were en pasado')
    expect(localized.steps[3].subtitle).toBe('was, were, yesterday · 3 palabras nuevas')
    expect(localized.steps[4].subtitle).toBe('Sugerencia opcional · Reflexión al final del día')
  })
})

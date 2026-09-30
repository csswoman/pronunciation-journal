import { describe, expect, it } from 'vitest'
import { activationSummary, primaryActionLabel, setupSubtitle, suggestionsIntro } from '../setup-copy'
import type { GapSuggestion } from '../gap-suggestions'
import type { SprintGap } from '../types'

const PAST: SprintGap = { kind: 'grammar', targetId: 'grammar:past simple', label: 'Pasado simple', level: 'a2' }
const VOWEL: SprintGap = { kind: 'phoneme', targetId: 'vowel:/ɪ/', label: '/ɪ/ vs /iː/', level: 'a2' }

const suggestion = (source: GapSuggestion['source']): GapSuggestion => ({ ...PAST, reason: '', source })

describe('setupSubtitle', () => {
  it('cambia según cuántos focos llevas', () => {
    const texts = [0, 1, 2].map((n) => setupSubtitle('focus', n, 7))
    expect(new Set(texts).size).toBe(3)
  })

  it('en el paso del plan menciona la duración', () => {
    expect(setupSubtitle('plan', 1, 14)).toContain('14 días')
  })
})

describe('activationSummary', () => {
  it('sin focos invita a elegir', () => {
    expect(activationSummary('focus', [], 7).headline).toBe('Aún no eliges un foco')
  })

  it('con un foco sugiere sumar otro y con dos no', () => {
    expect(activationSummary('focus', [PAST], 7).hint).toBe('Puedes sumar uno más')
    expect(activationSummary('focus', [PAST, VOWEL], 7).hint).toBeNull()
  })

  it('en el plan muestra la duración', () => {
    expect(activationSummary('plan', [PAST], 3)).toEqual({ headline: 'Pasado simple', hint: '3 días' })
  })
})

describe('primaryActionLabel', () => {
  it('refleja paso, selección y duración', () => {
    expect(primaryActionLabel('focus', 0, 7, null)).toBe('Elige un foco')
    expect(primaryActionLabel('focus', 1, 7, null)).toBe('Ver mi plan')
    expect(primaryActionLabel('plan', 1, 14, null)).toBe('Empezar sprint de 14 días')
  })

  it('durante la activación muestra la etapa en curso', () => {
    expect(primaryActionLabel('plan', 1, 7, 'Creando tu sprint...')).toBe('Creando tu sprint...')
  })
})

describe('suggestionsIntro', () => {
  it('sin historial no finge personalización', () => {
    expect(suggestionsIntro([suggestion('default')])).toContain('Aún no tenemos')
  })

  it('distingue sugerencias personales y mixtas', () => {
    expect(suggestionsIntro([suggestion('history')])).toContain('Salen de tus fallos')
    expect(suggestionsIntro([suggestion('history'), suggestion('default')])).toContain('el resto')
  })
})

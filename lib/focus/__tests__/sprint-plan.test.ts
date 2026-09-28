import { describe, expect, it } from 'vitest'
import { buildSprintPlan } from '../sprint-plan'
import type { SprintGap } from '../types'

const PAST: SprintGap = { kind: 'grammar', targetId: 'grammar:past simple', label: 'Pasado simple', level: 'a2' }
const VOWEL: SprintGap = { kind: 'phoneme', targetId: 'vowel:/ɪ/', label: '/ɪ/ vs /iː/', level: 'a2' }

describe('buildSprintPlan', () => {
  it('genera un día por cada día del sprint', () => {
    expect(buildSprintPlan([PAST], 3).days).toHaveLength(3)
    expect(buildSprintPlan([PAST], 7).days).toHaveLength(7)
    expect(buildSprintPlan([PAST], 14).days).toHaveLength(14)
  })

  it('en 7 días recorre los 5 formatos, vuelve a lo más difícil y cierra', () => {
    const kinds = buildSprintPlan([PAST], 7).days.map((d) => d.kind)
    expect(kinds).toEqual(['story', 'drill', 'dialogue', 'error_trap', 'song', 'free', 'closing'])
  })

  it('en 3 días usa los primeros formatos', () => {
    const kinds = buildSprintPlan([PAST], 3).days.map((d) => d.kind)
    expect(kinds).toEqual(['story', 'drill', 'dialogue'])
  })

  it('en 14 días casi no repite títulos y nunca dos iguales seguidos', () => {
    const titles = buildSprintPlan([PAST], 14).days.map((d) => d.title)
    expect(new Set(titles).size).toBeGreaterThanOrEqual(13)
    titles.forEach((t, i) => expect(titles[i + 1]).not.toBe(t))
    expect(titles.at(-1)).toBe('Último día')
  })

  it('solo la historia existe al activar; lo demás se genera o se reutiliza', () => {
    const availability = buildSprintPlan([PAST], 14).days.map((d) => d.availability)
    expect(availability[0]).toBe('on_activate')
    expect(availability.slice(1, 5).every((a) => a === 'on_demand')).toBe(true)
    expect(availability.slice(5).every((a) => a === 'reuse')).toBe(true)
  })

  it('no promete funciones que el sprint no tiene', () => {
    const text = buildSprintPlan([PAST], 14).days.map((d) => `${d.title} ${d.detail}`).join(' ').toLowerCase()
    expect(text).not.toMatch(/renuev|tus fallos del sprint|cuéntal/)
  })

  it('une los focos elegidos en una etiqueta legible', () => {
    expect(buildSprintPlan([PAST, VOWEL], 7).focusLabel).toBe('Pasado simple y /ɪ/ vs /iː/')
  })

  it('usa el ejemplo real del tema en la trampa de errores', () => {
    const plan = buildSprintPlan([PAST], 7)
    expect(plan.days.find((d) => d.kind === 'error_trap')?.detail).toContain('Yesterday I go to the office')
    expect(plan.example?.right).toBe('Yesterday I went to the office')
  })

  it('sin ejemplo disponible no inventa uno', () => {
    const plan = buildSprintPlan([VOWEL], 7)
    expect(plan.example).toBeNull()
    expect(plan.days.find((d) => d.kind === 'error_trap')?.detail).not.toContain('"')
  })

  it('marca cuando hay un foco de sonido', () => {
    expect(buildSprintPlan([PAST], 7).hasSoundFocus).toBe(false)
    expect(buildSprintPlan([PAST, VOWEL], 7).hasSoundFocus).toBe(true)
  })

  it('calcula minutos totales y promedio', () => {
    const plan = buildSprintPlan([PAST], 3)
    expect(plan.totalMinutes).toBe(plan.days.reduce((s, d) => s + d.minutes, 0))
    expect(plan.avgMinutes).toBe(Math.round(plan.totalMinutes / 3))
  })

  it('sin focos devuelve un plan vacío', () => {
    const plan = buildSprintPlan([], 7)
    expect(plan.days).toEqual([])
    expect(plan.totalMinutes).toBe(0)
  })
})

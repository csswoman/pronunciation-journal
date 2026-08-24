import { describe, it, expect } from 'vitest'
import { resolvePrimaryAction } from '@/lib/home/primary-action'

const base = {
  hasPlacement: true,
  planDoneToday: false,
  dueCount: 0,
  estimatedMinutes: 12,
}

describe('resolvePrimaryAction', () => {
  it('sends a brand-new learner to the placement test', () => {
    const action = resolvePrimaryAction({ ...base, hasPlacement: false })
    expect(action.href).toBe('/assessment')
    expect(action.label).toContain('Empezar')
  })

  it('sends everyone else to the daily plan', () => {
    const action = resolvePrimaryAction(base)
    expect(action.href).toBe('/daily')
  })

  it('states the time commitment in the label', () => {
    expect(resolvePrimaryAction({ ...base, estimatedMinutes: 12 }).label)
      .toContain('12 min')
  })

  it('mentions pending reviews when there are some', () => {
    const action = resolvePrimaryAction({ ...base, dueCount: 7 })
    expect(action.sublabel).toContain('7')
  })

  it('omits the review sublabel when nothing is due', () => {
    expect(resolvePrimaryAction(base).sublabel).toBeUndefined()
  })

  it('switches to a calmer label once the plan is done', () => {
    const action = resolvePrimaryAction({ ...base, planDoneToday: true })
    expect(action.variant).toBe('secondary')
    expect(action.label).not.toContain('Empezar')
  })

  it('still points somewhere useful when the plan is done', () => {
    expect(resolvePrimaryAction({ ...base, planDoneToday: true }).href).toBeTruthy()
  })

  it('prioritises placement over a finished plan', () => {
    const action = resolvePrimaryAction({
      ...base,
      hasPlacement: false,
      planDoneToday: true,
    })
    expect(action.href).toBe('/assessment')
  })
})

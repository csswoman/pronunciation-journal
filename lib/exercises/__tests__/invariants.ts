import { expect } from 'vitest'
import type { FillBlankExercise } from '@/lib/exercises/types'

/** Contract checks every fill-blank exercise must satisfy. */
export function assertFillBlankInvariant(ex: FillBlankExercise): void {
  expect(ex.sentence).toContain('___')
  expect(ex.sentence).not.toMatch(new RegExp(`\\b${escapeRegex(ex.answer)}\\b`, 'i'))
  expect(ex.options).toHaveLength(4)
  expect(ex.options).toContain(ex.answer)
  expect(ex.options.filter((o) => o === ex.answer)).toHaveLength(1)
  expect(ex.type).toBe('fill_blank')
  expect(ex.sourceRef.id).toBeTruthy()
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

import { describe, expect, it } from 'vitest'
import { studyContextLine } from '../study-context'

describe('studyContextLine', () => {
  it('identifies the current item as a new word and retains block progress', () => {
    expect(studyContextLine(1, 3)).toBe('Palabra nueva · bloque 2 de 3')
  })
})

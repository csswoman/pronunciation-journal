import { describe, it, expect } from 'vitest'
import { expandVariants } from '../variants'

describe('expandVariants', () => {
  it('includes the exact lowercased base form', () => {
    expect(expandVariants('study')).toContain('study')
  })

  it('generates regular suffix variants', () => {
    const v = expandVariants('study')
    expect(v).toEqual(expect.arrayContaining(['studies', 'studied', 'studying']))
  })

  it('handles consonant doubling for -ed/-ing', () => {
    const v = expandVariants('stop')
    expect(v).toEqual(expect.arrayContaining(['stops', 'stopped', 'stopping']))
  })

  it('drops trailing e before -ing', () => {
    expect(expandVariants('make')).toEqual(expect.arrayContaining(['makes', 'making']))
  })

  it('uses the irregular table when the base is irregular', () => {
    const v = expandVariants('go')
    expect(v).toEqual(expect.arrayContaining(['go', 'goes', 'went', 'gone', 'going']))
  })

  it('handles irregular plurals', () => {
    expect(expandVariants('child')).toEqual(expect.arrayContaining(['child', 'children']))
  })
})

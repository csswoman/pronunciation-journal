import { describe, it, expect } from 'vitest'
import { decodeHtmlEntities } from '../decode-html'
import { normalizeImmersionTeacher } from '../types'

describe('normalizeImmersionTeacher', () => {
  it('canonicalizes scraped teacher slugs to the typed union', () => {
    expect(normalizeImmersionTeacher('adam')).toBe('Adam')
    expect(normalizeImmersionTeacher('ADAM')).toBe('Adam')
    expect(normalizeImmersionTeacher('Emma')).toBe('Emma')
    expect(normalizeImmersionTeacher('unknown-teacher')).toBeNull()
  })
})

describe('decodeHtmlEntities', () => {
  it('decodes numeric HTML entities used in EngVid copy', () => {
    expect(decodeHtmlEntities('&#8220;That&#8217;ll be 66 cents please.&#8221;')).toBe(
      '“That’ll be 66 cents please.”',
    )
    expect(decodeHtmlEntities('Sikysi&#8230; what?')).toBe('Sikysi… what?')
  })
})

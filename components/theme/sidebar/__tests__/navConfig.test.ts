import { describe, expect, it } from 'vitest'
import { learnNav } from '../navConfig'

describe('learnNav', () => {
  it('offers one direct Reader entry alongside guided learning tools', () => {
    expect(learnNav.items.filter((item) => item.href === '/practice/reader')).toHaveLength(1)
    expect(learnNav.items.find((item) => item.href === '/practice/reader')).toMatchObject({
      name: 'Lectura',
    })
  })
})

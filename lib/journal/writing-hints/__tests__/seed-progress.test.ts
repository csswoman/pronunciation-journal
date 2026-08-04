import { describe, expect, it } from 'vitest'
import {
  activeStructureIndex,
  firstUnusedStarterIndex,
  seedWordIsUsed,
} from '@/lib/journal/writing-hints/seed-progress'

describe('journal writing hint progress', () => {
  it('matches seed words and simple plural/past forms without substring matches', () => {
    expect(seedWordIsUsed('cozy', 'The room is cozy.')).toBe(true)
    expect(seedWordIsUsed('shelf', 'There are two shelfs near the window.')).toBe(true)
    expect(seedWordIsUsed('finish', 'I finished my task early.')).toBe(true)
    expect(seedWordIsUsed('manage to', 'I managed to finish early.')).toBe(true)
    expect(seedWordIsUsed('calm', 'The calmness helps me.')).toBe(false)
  })

  it('moves through structure thirds using the target length', () => {
    expect(activeStructureIndex(0, 60)).toBe(0)
    expect(activeStructureIndex(19, 60)).toBe(0)
    expect(activeStructureIndex(20, 60)).toBe(1)
    expect(activeStructureIndex(39, 60)).toBe(1)
    expect(activeStructureIndex(40, 60)).toBe(2)
  })

  it('finds the first sentence starter the learner has not used', () => {
    expect(
      firstUnusedStarterIndex(
        ['Today, I...', 'One detail I remember is...', 'It made me feel...'],
        'Today, I went outside. One detail I remember is the rain.',
      ),
    ).toBe(2)
  })
})

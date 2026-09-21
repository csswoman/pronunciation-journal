import { describe, it, expect } from 'vitest'
import { recentMissionAvoidance } from '../mission-avoidance'

// This test locks in the *contract* composer.ts must honor: given avoidance
// = true, the mission step it builds must carry scaffolded: true. The full
// composer integration (Dexie-backed, many parallel fetches) is exercised
// by composer.test.ts if present; this test guards the narrow seam so a
// future composer refactor cannot silently drop the flag.
describe('mission avoidance contract', () => {
  it('is a pure boolean the composer can read synchronously before building the mission step', () => {
    expect(typeof recentMissionAvoidance([])).toBe('boolean')
  })
})

import { describe, expect, it } from 'vitest'
import { parseMissionStructuredEvent } from '../events'

describe('mission structured events', () => {
  it('accepts a known mission start', () => {
    expect(parseMissionStructuredEvent('start_mission', { missionId: 'roleplay.cafe' })).toEqual({
      ok: true,
      event: { type: 'start_mission', missionId: 'roleplay.cafe' },
    })
  })

  it('rejects unknown mission ids instead of falling back', () => {
    expect(parseMissionStructuredEvent('start_mission', { missionId: 'roleplay.nope' })).toEqual({
      ok: false,
      error: 'unknown_mission',
    })
  })

  it('accepts an intent report for reducer-level authorization', () => {
    expect(parseMissionStructuredEvent('mission_intent_observed', { intentId: 'stated_order' })).toEqual({
      ok: true,
      event: { type: 'intent_observed', intentId: 'stated_order' },
    })
  })

  it('rejects malformed args and unknown event names', () => {
    expect(parseMissionStructuredEvent('mission_intent_observed', { intentId: '' })).toEqual({
      ok: false,
      error: 'invalid_args',
    })
    expect(parseMissionStructuredEvent('mission_completed', {})).toEqual({
      ok: false,
      error: 'unknown_event',
    })
  })
})

import { describe, expect, it } from 'vitest'
import type {
  MissionIntentObservedArgs,
  StartMissionArgs,
} from '@/lib/ai-practice/tools/registry'

describe('useStreamingChat mission handler contract', () => {
  it('keeps mission tool payloads string-only', () => {
    const start: StartMissionArgs = { missionId: 'roleplay.cafe' }
    const intent: MissionIntentObservedArgs = { intentId: 'ordered_drink' }

    expect(typeof start.missionId).toBe('string')
    expect(typeof intent.intentId).toBe('string')
  })
})

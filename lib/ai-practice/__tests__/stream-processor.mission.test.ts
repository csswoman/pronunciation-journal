import { describe, expect, it, vi } from 'vitest'
import { makeStreamState, processChunk, type ActionHandlers } from '../stream-processor'

function handlers(): ActionHandlers {
  return {
    onSaveWord: vi.fn(),
    onStartRoleplay: vi.fn(),
    onStartMission: vi.fn(),
    onMissionIntentObserved: vi.fn(),
    onActionToolResult: vi.fn(),
    onError: vi.fn(),
  }
}

function call(
  name: string,
  args: Record<string, unknown>,
  state: ReturnType<typeof makeStreamState>,
  actionHandlers: ActionHandlers,
) {
  processChunk({ type: 'tool_call_start', id: 'call-1', name }, state, actionHandlers)
  processChunk({ type: 'tool_call_args_delta', id: 'call-1', delta: JSON.stringify(args) }, state, actionHandlers)
  return processChunk({ type: 'tool_call_end', id: 'call-1' }, state, actionHandlers)
}

describe('mission stream events', () => {
  it('dispatches a known start_mission event', () => {
    const state = makeStreamState()
    const actionHandlers = handlers()

    call('start_mission', { missionId: 'roleplay.cafe' }, state, actionHandlers)

    expect(actionHandlers.onStartMission).toHaveBeenCalledWith('roleplay.cafe')
    expect(actionHandlers.onActionToolResult).toHaveBeenCalledWith('call-1', 'start_mission')
    expect(state.calls.get('call-1')?.status).toBe('answered')
  })

  it('dispatches an intent report and rejects unknown mission starts', () => {
    const state = makeStreamState()
    const actionHandlers = handlers()

    call('mission_intent_observed', { intentId: 'placed_order' }, state, actionHandlers)
    call('start_mission', { missionId: 'roleplay.nope' }, state, actionHandlers)

    expect(actionHandlers.onMissionIntentObserved).toHaveBeenCalledWith('placed_order')
    expect(state.calls.get('call-1')?.status).toBe('error')
    expect(actionHandlers.onError).toHaveBeenCalled()
  })
})

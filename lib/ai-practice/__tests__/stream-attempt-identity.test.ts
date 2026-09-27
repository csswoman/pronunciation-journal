import { describe, expect, it, vi } from 'vitest'
import { makeStreamState, processChunk } from '../stream-processor'

describe('stream widget execution identity', () => {
  it('does not reuse a widget when transport ids collide within or between streams', () => {
    const handlers = { onActionToolResult: vi.fn(), onError: vi.fn() }
    const state = makeStreamState()
    const fresh = makeStreamState()
    const send = (target: typeof state) => {
      processChunk({ type: 'tool_call_start', id: 'render_fill_blank_123', name: 'render_fill_blank' }, target, handlers)
      processChunk({ type: 'tool_call_args_delta', id: 'render_fill_blank_123', delta: JSON.stringify({ sentence: 'She ___ happy.', answer: 'is', topic: 'grammar:present simple' }) }, target, handlers)
      processChunk({ type: 'tool_call_end', id: 'render_fill_blank_123' }, target, handlers)
    }
    send(state); send(state); send(fresh)
    expect(state.calls.size).toBe(2)
    expect(new Set([...state.calls.keys(), ...fresh.calls.keys()]).size).toBe(3)
    expect([...state.calls.values()].every(call => call.status === 'rendered')).toBe(true)
    expect(state.parts.filter(part => part.type === 'tool_call').map(part => part.callId)).toEqual([...state.calls.keys()])
  })
})

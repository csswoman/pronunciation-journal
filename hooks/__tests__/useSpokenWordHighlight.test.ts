// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpokenWordHighlight } from '../useSpokenWordHighlight'

describe('useSpokenWordHighlight', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('no resalta nada antes de empezar', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    expect(result.current.activeIndex).toBeNull()
  })

  it('avanza de palabra segun pasa el tiempo estimado', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))

    act(() => { result.current.start(900) })
    expect(result.current.activeIndex).toBe(0)

    act(() => { vi.advanceTimersByTime(320) })
    expect(result.current.activeIndex).toBe(1)

    act(() => { vi.advanceTimersByTime(320) })
    expect(result.current.activeIndex).toBe(2)
  })

  it('stop limpia el resaltado', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    act(() => { result.current.start(900) })
    act(() => { result.current.stop() })
    expect(result.current.activeIndex).toBeNull()
  })

  it('sin duracion fiable no resalta nada', () => {
    // Es el caso de `speechSynthesis` sin duracion conocida: preferimos
    // no resaltar a resaltar mal.
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    act(() => { result.current.start(0) })
    expect(result.current.activeIndex).toBeNull()
  })

  it('una marca real de boundary manda sobre la estimacion', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    act(() => { result.current.start(900) })
    act(() => { result.current.markWord(2) })
    expect(result.current.activeIndex).toBe(2)

    // Tras una marca real, la estimacion ya no pisa el valor.
    act(() => { vi.advanceTimersByTime(320) })
    expect(result.current.activeIndex).toBe(2)
  })
})

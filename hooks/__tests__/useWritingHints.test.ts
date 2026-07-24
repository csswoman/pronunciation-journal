// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWritingHints } from '@/hooks/useWritingHints'

describe('useWritingHints', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns no hints immediately after a content change (debounced)', () => {
    const { result, rerender } = renderHook(
      ({ content, enabled }) => useWritingHints(content, enabled),
      { initialProps: { content: 'I goed home.', enabled: true } },
    )
    rerender({ content: 'I goed home.', enabled: true })
    expect(result.current).toHaveLength(0)
  })

  it('returns hints after the debounce delay', () => {
    const { result } = renderHook(() => useWritingHints('I goed home.', true))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('returns no hints when disabled', () => {
    const { result } = renderHook(() => useWritingHints('I goed home.', false))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toHaveLength(0)
  })
})

// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useWritingHintsPreference } from '@/hooks/useWritingHintsPreference'

describe('useWritingHintsPreference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to enabled when nothing is stored', () => {
    const { result } = renderHook(() => useWritingHintsPreference())
    expect(result.current.enabled).toBe(true)
  })

  it('persists the toggle to localStorage', () => {
    const { result } = renderHook(() => useWritingHintsPreference())
    act(() => result.current.setEnabled(false))
    expect(result.current.enabled).toBe(false)
    expect(localStorage.getItem('journal:writing-hints-enabled')).toBe('false')
  })

  it('reads a previously stored false value on mount', () => {
    localStorage.setItem('journal:writing-hints-enabled', 'false')
    const { result } = renderHook(() => useWritingHintsPreference())
    expect(result.current.enabled).toBe(false)
  })
})

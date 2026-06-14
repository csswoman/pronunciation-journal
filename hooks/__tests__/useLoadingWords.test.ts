// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLoadingWords } from '../useLoadingWords'
import * as queries from '@/lib/word-bank/queries'

describe('useLoadingWords', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 10 fallback words immediately before fetch resolves', () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useLoadingWords())
    expect(result.current).toHaveLength(10)
  })

  it('switches to user words when fetch returns entries', async () => {
    const userWords = Array.from({ length: 15 }, (_, i) => ({
      text: `word${i}`,
      ipa: `/wɜːrd${i}/`,
    }))
    vi.spyOn(queries, 'getReadyWordSummaries').mockResolvedValue(userWords)
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => {
      expect(result.current.every(w => w.text.startsWith('word'))).toBe(true)
    })
    expect(result.current).toHaveLength(10)
  })

  it('keeps fallback when fetch returns empty array', async () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockResolvedValue([])
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => {
      expect(result.current.some(w => w.text === 'thought')).toBe(true)
    })
    expect(result.current).toHaveLength(10)
  })

  it('keeps fallback on network error', async () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => {
      expect(result.current).toHaveLength(10)
      expect(result.current.some(w => w.text === 'thought')).toBe(true)
    })
  })

  it('includes ipa field for each word', () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useLoadingWords())
    expect(result.current.every(w => typeof w.ipa === 'string' || w.ipa === null)).toBe(true)
  })
})

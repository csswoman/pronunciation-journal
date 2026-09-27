// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { useLoadingWords, FALLBACK_WORDS } from '../useLoadingWords'
import * as queries from '@/lib/word-bank/queries'

describe('useLoadingWords', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the same stable fallback words on the server', () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockReturnValue(new Promise(() => {})) // never resolves
    function Probe() {
      return createElement('span', null, useLoadingWords().map((word) => word.text).join(','))
    }

    const markup = renderToString(createElement(Probe))
    expect(markup).toContain(FALLBACK_WORDS.slice(0, 10).map((word) => word.text).join(','))
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
      expect(result.current).toHaveLength(10)
      expect(result.current.every(w => FALLBACK_WORDS.some(fw => fw.text === w.text))).toBe(true)
    })
  })

  it('keeps fallback on network error', async () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => {
      expect(result.current).toHaveLength(10)
      expect(result.current.every(w => FALLBACK_WORDS.some(fw => fw.text === w.text))).toBe(true)
    })
  })

  it('includes ipa field for each word', () => {
    vi.spyOn(queries, 'getReadyWordSummaries').mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useLoadingWords())
    expect(result.current.every(w => typeof w.ipa === 'string' || w.ipa === null)).toBe(true)
  })
})

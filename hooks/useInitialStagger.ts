'use client'

import { useRef, useEffect, type CSSProperties } from 'react'

/**
 * Hook to provide stagger style variables only during the initial component render
 * or when an explicit `resetKey` changes (e.g. switching dataset/deck without unmounting).
 *
 * On the initial render of a dataset, `getStaggerStyle(i)` produces `{ '--stagger-index': i }`.
 * On subsequent re-renders (search keystrokes, local filter changes), it returns `undefined`,
 * falling back to delay 0 and preventing annoying re-staggers.
 */
export function useInitialStagger(resetKey?: unknown) {
  const isFirstRender = useRef(true)
  const prevKeyRef = useRef(resetKey)

  if (resetKey !== undefined && resetKey !== prevKeyRef.current) {
    isFirstRender.current = true
    prevKeyRef.current = resetKey
  }

  const shouldStagger = isFirstRender.current

  useEffect(() => {
    isFirstRender.current = false
  })

  const getStaggerStyle = (index: number): CSSProperties | undefined => {
    if (!shouldStagger) return undefined
    return { '--stagger-index': index } as CSSProperties
  }

  return {
    isInitialMount: shouldStagger,
    getStaggerStyle,
  }
}

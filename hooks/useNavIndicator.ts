'use client'

import { useState, useLayoutEffect, useCallback, type RefObject } from 'react'

export interface NavIndicatorStyle {
  transform: string
  width: string
  height: string
  opacity: number
}

interface UseNavIndicatorOptions {
  containerRef: RefObject<HTMLElement | null>
  activeKey: string | number | null
  selector?: string
}

/**
 * Calculates translation coordinates and dimensions for a moving indicator
 * tracking the active navigation element inside a relative container.
 */
export function useNavIndicator({
  containerRef,
  activeKey,
  selector = '[data-nav-active="true"]',
}: UseNavIndicatorOptions) {
  const [style, setStyle] = useState<NavIndicatorStyle>({
    transform: 'translate3d(0, 0, 0)',
    width: '0px',
    height: '0px',
    opacity: 0,
  })
  const [isReady, setIsReady] = useState(false)

  const updatePosition = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const activeElement = container.querySelector<HTMLElement>(selector)
    if (!activeElement) {
      setStyle((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }))
      return
    }

    const containerRect = container.getBoundingClientRect()
    const activeRect = activeElement.getBoundingClientRect()

    const x = Math.round(activeRect.left - containerRect.left)
    const y = Math.round(activeRect.top - containerRect.top)
    const w = `${Math.round(activeRect.width)}px`
    const h = `${Math.round(activeRect.height)}px`
    const transform = `translate3d(${x}px, ${y}px, 0)`

    setStyle((prev) => {
      if (
        prev.transform === transform &&
        prev.width === w &&
        prev.height === h &&
        prev.opacity === 1
      ) {
        return prev
      }
      return { transform, width: w, height: h, opacity: 1 }
    })
    setIsReady(true)
  }, [containerRef, selector])

  useLayoutEffect(() => {
    updatePosition()

    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      updatePosition()
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [activeKey, updatePosition])

  return { indicatorStyle: style, isReady }
}

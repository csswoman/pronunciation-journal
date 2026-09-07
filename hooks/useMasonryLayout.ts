'use client'

import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

const MOBILE_QUERY = '(max-width: 767px)'
const ITEM_SELECTOR = '.practice-hub__masonry-item'

function parsePx(value: string): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function computeSpan(height: number, rowBase: number, gap: number): number {
  const unit = rowBase + gap
  if (unit <= 0) return 1
  return Math.max(1, Math.ceil((height + gap) / unit))
}

/**
 * Keeps each direct `.practice-hub__masonry-item` child's `gridRowEnd` synced to
 * its measured height so the CSS grid behaves as a masonry. Inert on mobile
 * (where the container is `flex column`) and when `ResizeObserver` is missing.
 */
export function useMasonryLayout(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return

    if (typeof ResizeObserver === 'undefined') {
      container.setAttribute('data-masonry-off', '')
      return
    }

    let mql: MediaQueryList | null = null
    let observer: ResizeObserver | null = null

    const items = () =>
      Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR))

    const clear = () => {
      for (const item of items()) item.style.gridRowEnd = ''
    }

    const layout = () => {
      if (mql?.matches) {
        clear()
        return
      }
      const styles = window.getComputedStyle(container)
      const rowBase = parsePx(styles.getPropertyValue('grid-auto-rows'))
      const gap = parsePx(styles.getPropertyValue('row-gap'))
      for (const item of items()) {
        const height = item.getBoundingClientRect().height
        item.style.gridRowEnd = `span ${computeSpan(height, rowBase, gap)}`
      }
    }

    mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => layout()
    mql.addEventListener('change', onChange)

    observer = new ResizeObserver(() => layout())
    observer.observe(container)
    for (const item of items()) observer.observe(item)

    layout()

    return () => {
      mql?.removeEventListener('change', onChange)
      observer?.disconnect()
      clear()
      container.removeAttribute('data-masonry-off')
    }
  }, [ref])
}

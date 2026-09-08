// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useMasonryLayout } from '../useMasonryLayout'

class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

function mountGrid(childHeights: number[]) {
  const container = document.createElement('div')
  container.className = 'practice-hub__masonry'
  for (const h of childHeights) {
    const child = document.createElement('div')
    child.className = 'practice-hub__masonry-item'
    // jsdom has no layout; stub the measured height.
    Object.defineProperty(child, 'getBoundingClientRect', {
      value: () => ({ height: h }) as DOMRect,
      configurable: true,
    })
    container.appendChild(child)
  }
  document.body.appendChild(container)
  return container
}

function resetBody() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }
}

beforeEach(() => {
  resetBody()
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: false, // desktop by default
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  )
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        getPropertyValue: (prop: string) => {
          if (prop === 'grid-auto-rows') return '8px'
          if (prop === 'row-gap') return '20px'
          return ''
        },
      }) as unknown as CSSStyleDeclaration,
  )
})

describe('useMasonryLayout', () => {
  it('sets gridRowEnd on each child from its measured height', () => {
    // rowBase 8, gap 20 -> unit = 28
    // height 100 -> ceil((100 + 20) / 28) = ceil(4.28) = 5
    // height 300 -> ceil((300 + 20) / 28) = ceil(11.43) = 12
    const container = mountGrid([100, 300])
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    const children = container.children
    expect((children[0] as HTMLElement).style.gridRowEnd).toBe('span 5')
    expect((children[1] as HTMLElement).style.gridRowEnd).toBe('span 12')
  })

  it('clears gridRowEnd when the mobile media query matches', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: true, // mobile
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          onchange: null,
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    )
    const container = mountGrid([100, 300])
    // Pre-set stale inline values to prove they get cleared.
    ;(container.children[0] as HTMLElement).style.gridRowEnd = 'span 9'
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('')
    expect((container.children[1] as HTMLElement).style.gridRowEnd).toBe('')
  })

  it('flags data-masonry-off when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const container = mountGrid([100, 300])
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    expect(container.hasAttribute('data-masonry-off')).toBe(true)
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('')
  })

  it('disconnects the observer and clears styles on unmount', () => {
    const container = mountGrid([100, 300])
    let disconnectSpy: ReturnType<typeof vi.fn> | null = null
    class SpyRO extends MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        super(cb)
        disconnectSpy = this.disconnect
      }
    }
    vi.stubGlobal('ResizeObserver', SpyRO)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('span 5')

    unmount()
    expect(disconnectSpy).toHaveBeenCalled()
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('')
  })
})

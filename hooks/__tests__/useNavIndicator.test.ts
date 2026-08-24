// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNavIndicator } from '../useNavIndicator'
import { useRef } from 'react'

describe('useNavIndicator', () => {
  it('returns zero dimensions and 0 opacity when container has no active element', () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null)
      return useNavIndicator({
        containerRef,
        activeKey: null,
      })
    })

    expect(result.current.indicatorStyle).toEqual({
      transform: 'translate3d(0, 0, 0)',
      width: '0px',
      height: '0px',
      opacity: 0,
    })
    expect(result.current.isReady).toBe(false)
  })

  it('measures active element position relative to container', () => {
    const container = document.createElement('div')
    const activeChild = document.createElement('button')
    activeChild.setAttribute('data-nav-active', 'true')
    container.appendChild(activeChild)
    document.body.appendChild(container)

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 400,
      height: 60,
      right: 500,
      bottom: 110,
      x: 100,
      y: 50,
      toJSON: () => {},
    })

    vi.spyOn(activeChild, 'getBoundingClientRect').mockReturnValue({
      left: 150,
      top: 55,
      width: 80,
      height: 40,
      right: 230,
      bottom: 95,
      x: 150,
      y: 55,
      toJSON: () => {},
    })

    const { result } = renderHook(() => {
      const containerRef = { current: container }
      return useNavIndicator({
        containerRef,
        activeKey: 'home',
      })
    })

    expect(result.current.indicatorStyle).toEqual({
      transform: 'translate3d(50px, 5px, 0)',
      width: '80px',
      height: '40px',
      opacity: 1,
    })
    expect(result.current.isReady).toBe(true)

    document.body.removeChild(container)
  })
})

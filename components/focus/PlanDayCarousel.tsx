'use client'

// Planned structure:
// <PlanDayCarousel>
//   <ScrollTrack (scroll-snap horizontal)>{children}</ScrollTrack>
//   <ArrowButtons (prev / next)>
// </PlanDayCarousel>

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from '@/components/icons'
import { cn } from '@/lib/cn'

interface PlanDayCarouselProps {
  children: ReactNode
  label: string
}

export function PlanDayCarousel({ children, label }: PlanDayCarouselProps) {
  const trackRef = useRef<HTMLOListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [update])

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <ol
        ref={trackRef}
        onScroll={update}
        aria-label={label}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ol>
      <div className="mt-1 flex items-center justify-end gap-2">
        {[
          { dir: -1 as const, enabled: canPrev, Icon: ChevronLeft, name: 'Días anteriores' },
          { dir: 1 as const, enabled: canNext, Icon: ChevronRight, name: 'Días siguientes' },
        ].map(({ dir, enabled, Icon, name }) => (
          <button
            key={dir}
            type="button"
            aria-label={name}
            disabled={!enabled}
            onClick={() => scrollByPage(dir)}
            className={cn(
              'focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-xs transition-opacity',
              enabled ? 'hover:shadow-md' : 'opacity-40',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

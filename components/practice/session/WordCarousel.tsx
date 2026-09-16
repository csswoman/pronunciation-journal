// Planned structure:
// <WordCarousel>
//   <LoaderCard>
//     <PhoneticHeaderBadge />
//     <WordSlot />      (word text + IPA badge with smooth motion)
//     <ProgressBar />
//     <LoadingLabel />
//   </LoaderCard>
// </WordCarousel>

'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { Waves } from '@/components/icons'
import type { LoadingWord } from '@/hooks/loading-words-data'

interface WordCarouselProps {
  words: LoadingWord[]
}

export function WordCarousel({ words }: WordCarouselProps) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const prefersReduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    if (words.length === 0) return
    let timeoutId: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      setVisible(false)
      timeoutId = setTimeout(() => {
        setIndex(i => (i + 1) % words.length)
        setVisible(true)
      }, 260)
    }, 2400)
    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [words.length])

  const current = words[index]
  if (!current) return null

  return (
    <div className="mx-auto flex w-full max-w-xs sm:max-w-sm flex-col items-center justify-center p-layout-page-inline py-layout-section-gap">
      <div className="flex w-full flex-col items-center justify-center gap-5 rounded-2xl bg-surface-raised p-6 sm:p-7 border border-border-subtle/80 shadow-sm transition-colors duration-300">
        {/* Header badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-primary-soft/60 px-3 py-1 text-primary border border-primary/10">
          <Waves className="h-3.5 w-3.5 animate-pulse text-primary shrink-0" />
          <span className="font-kicker text-[10px] tracking-wider uppercase font-semibold text-primary">
            Journal Practice
          </span>
        </div>

        {/* Animated Word + IPA Slot */}
        <div className="flex min-h-20 w-full flex-col items-center justify-center gap-2 py-1">
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 transition-all duration-300',
              prefersReduced.current
                ? 'transition-opacity'
                : 'transition-[opacity,transform,filter] ease-out-expo',
              visible
                ? 'translate-y-0 opacity-100 scale-100 blur-none'
                : '-translate-y-2 opacity-0 scale-95 blur-[1px]'
            )}
          >
            <span className="font-sans text-h3 sm:text-h2 font-bold tracking-tight text-fg text-center">
              {current.text}
            </span>
            {current.ipa && (
              <span className="font-ipa text-body-md sm:text-body font-medium text-primary bg-primary-soft/40 px-3.5 py-1 rounded-full border border-primary/15 tracking-wide shadow-2xs">
                {current.ipa}
              </span>
            )}
          </div>
        </div>

        {/* Indeterminate progress bar */}
        <div className="flex w-full flex-col items-center gap-2">
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken border border-border-subtle/60"
            role="progressbar"
            aria-label="Cargando sesión"
            aria-busy="true"
          >
            <div className="h-full w-2/5 rounded-full bg-primary shadow-[0_0_10px_var(--primary-soft)] animate-loading-slide" />
          </div>
          <span className="font-kicker text-caption text-fg-subtle tracking-wider uppercase pt-1">
            Preparando tu sesión
          </span>
        </div>
      </div>
    </div>
  )
}


// Planned structure:
// <WordCarousel>
//   <WordSlot />   (word text + IPA, animated)
//   <ProgressBar />
//   <LoadingLabel />
// </WordCarousel>

'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
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
      }, 300)
    }, 2200)
    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [words.length])

  const current = words[index]
  if (!current) return null

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4 px-layout-page-inline py-layout-section-gap">
      {/* Word + IPA slot */}
      <div
        className={cn(
          'flex min-h-14 flex-col items-center justify-center gap-1 duration-300',
          prefersReduced.current
            ? 'transition-opacity'
            : 'transition-[opacity,transform] ease-out-expo',
          visible ? 'translate-y-0 opacity-100' : '-translate-y-1.5 opacity-0',
        )}
      >
        <span className="font-mono text-h4 font-medium text-primary tracking-wide">
          {current.text}
        </span>
        {current.ipa && (
          <span className="font-mono text-body-sm text-fg-muted">
            {current.ipa}
          </span>
        )}
      </div>

      {/* Indeterminate progress bar */}
      <div
        className="w-full h-0.5 rounded-full overflow-hidden bg-border-default"
        role="progressbar"
        aria-label="Cargando sesión"
        aria-busy="true"
      >
        <div className="h-full w-2/5 rounded-full bg-primary animate-loading-slide" />
      </div>

      {/* Label */}
      <span className="font-kicker text-fg-subtle">
        Preparando tu sesión
      </span>
    </div>
  )
}

// Planned structure:
// <WordCarousel>
//   <LoaderContainer>
//     <WordSlot />      (word text + clean IPA text with smooth motion)
//     <ProgressBar />   (vibrant progress track)
//     <LoadingLabel />  ("Preparando tu sesión")
//   </LoaderContainer>
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
      <div className="flex w-full flex-col items-center justify-center gap-6 text-center">
        {/* Animated Word + IPA Slot */}
        <div className="flex min-h-24 w-full flex-col items-center justify-center gap-2">
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 transition-all duration-300',
              prefersReduced.current
                ? 'transition-opacity'
                : 'transition-[opacity,transform,filter] ease-out-expo',
              visible
                ? 'translate-y-0 opacity-100 scale-100 blur-none'
                : '-translate-y-2 opacity-0 scale-95 blur-[1px]'
            )}
          >
            <span className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-fg text-center">
              {current.text}
            </span>
            {current.ipa && (
              <span className="font-ipa text-xl sm:text-2xl font-normal text-sky-400 dark:text-sky-300 tracking-wide text-center">
                {current.ipa}
              </span>
            )}
          </div>
        </div>

        {/* Indeterminate progress bar & subtitle */}
        <div className="flex w-full max-w-xs flex-col items-center gap-3 pt-2">
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80 border border-border-subtle/30"
            role="progressbar"
            aria-label="Cargando sesión"
            aria-busy="true"
          >
            <div className="h-full w-2/5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-loading-slide" />
          </div>
          <span className="font-sans text-body-sm font-normal text-fg-subtle tracking-normal">
            Preparando tu sesión
          </span>
        </div>
      </div>
    </div>
  )
}



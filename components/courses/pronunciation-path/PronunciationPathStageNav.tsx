'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { stageIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStage, PathStageId } from '@/lib/pronunciation/path/types'

interface PronunciationPathStageNavProps {
  stages: readonly PathStage[]
  activeStageId: PathStageId
  recommendedStageId?: PathStageId | null
}

export function PronunciationPathStageNav({
  stages,
  activeStageId,
  recommendedStageId = null,
}: PronunciationPathStageNavProps) {
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const node = activeRef.current
    if (!node || typeof node.scrollIntoView !== 'function') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      inline: 'nearest',
      block: 'nearest',
    })
  }, [activeStageId])

  return (
    <nav aria-label="Etapas de la ruta de pronunciación" className="min-w-0">
      {/*
        Mobile: wrap so all 5 stages stay visible (no hidden scrollbar).
        sm+: single row with scroll + edge fade when titles are longer.
      */}
      <div
        className={cn( 'relative min-w-0', 'sm:after:pointer-events-none sm:after:absolute sm:after:inset-y-0 sm:after:right-0 sm:after:w-8', 'sm:after:bg-linear-to-l sm:after:from-surface-base sm:after:to-transparent' )}
      >
        <ul
          className={cn(
            'flex min-w-0 flex-wrap gap-2',
            'sm:-mx-1 sm:flex-nowrap sm:overflow-x-auto sm:px-1 sm:pb-1',
            'sm:snap-x sm:snap-mandatory sm:scroll-px-1',
            'sm:scrollbar-thin sm:[scrollbar-color:var(--border-subtle)_transparent]'
          )}
        >
          {stages.map((stage, index) => {
            const isActive = stage.id === activeStageId
            const isRecommended = stage.id === recommendedStageId
            const stageLabel = isRecommended
              ? `${index + 1}. ${stage.titleEs} (siguiente práctica)`
              : `${index + 1}. ${stage.titleEs}`
            return (
              <li key={stage.id} className="min-w-0 sm:shrink-0 sm:snap-start">
                <Link
                  ref={isActive ? activeRef : undefined}
                  href={stageIdToPronunciationPathRoute(stage.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={stageLabel}
                  className={cn( 'inline-flex min-h-11 items-center rounded-sm px-3 font-label', isActive ? 'bg-primary-soft text-primary' : isRecommended ? 'bg-surface-sunken text-fg ring-1 ring-inset ring-badge-primary-border' : 'bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg' )}
                >
                  <span
                    className={cn( 'font-mono text-caption', isActive ? 'text-primary' : 'text-fg-subtle' )}
                    aria-hidden
                  >
                    {index + 1}.
                  </span>
                  <span className="ml-1.5 text-pretty leading-snug sm:hidden">
                    {stage.titleShortEs}
                  </span>
                  <span className="ml-1.5 hidden text-pretty leading-snug sm:inline">
                    {stage.titleEs}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

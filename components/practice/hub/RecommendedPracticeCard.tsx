'use client'

import Link from 'next/link'
import { MicVocal, ListOrdered, Layers, RotateCcw, BookOpen, Waves, Sparkles, Search } from "@/components/icons"
import type { ElementType } from 'react'
import { setLastPracticeMode } from '@/lib/db'
import type { RecommendedResult } from '@/lib/practice/practice-modes'

// Planned structure:
// <RecommendedPracticeCard> — single highlighted CTA to the recommended mode

export const MODE_ICONS: Record<string, ElementType> = {
  MicVocal,
  ListOrdered,
  Layers,
  RotateCcw,
  BookOpen,
  Waves,
  Sparkles,
  Search,
}

interface Props {
  recommendation: RecommendedResult
}

export default function RecommendedPracticeCard({ recommendation }: Props) {
  const { mode, headline, subtext, reason } = recommendation

  return (
    <div className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="font-kicker text-fg-subtle uppercase tracking-wider text-tiny">
          CONTINÚA DONDE LO DEJASTE
        </span>
        <h2 className="text-h3 font-bold text-fg">{headline}</h2>
        <p className="font-caption text-pretty text-fg-muted">{subtext}</p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
        <Link
          href={mode.href}
          onClick={() => void setLastPracticeMode(mode.id)}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 py-2 font-label font-semibold text-on-primary shadow-xs transition-all duration-150 hover:opacity-90 active:translate-y-[-1px]"
        >
          <span>Empezar repaso</span>
        </Link>
        {reason === 'due-review' && (
          <Link
            href="/practice/essential-words"
            onClick={() => void setLastPracticeMode('essential-words')}
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-4 py-2 font-label font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken active:translate-y-[-1px]"
          >
            <span>Ver cuáles</span>
          </Link>
        )}
      </div>
    </div>
  )
}

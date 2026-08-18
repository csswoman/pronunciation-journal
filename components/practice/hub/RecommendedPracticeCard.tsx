'use client'

import Link from 'next/link'
import { ArrowRight, MicVocal, ListOrdered, Layers, RotateCcw, BookOpen, Waves, Sparkles, Search } from "@/components/icons"
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
  const { mode, headline, subtext } = recommendation
  const Icon = MODE_ICONS[mode.icon] ?? MicVocal

  return (
    <Link
      href={mode.href}
      onClick={() => void setLastPracticeMode(mode.id)}
      aria-label={`${headline}. ${subtext}`}
      className="home-card-lift focus-ring group flex min-h-14 items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 transition-colors hover:border-primary"
    >
      <span className="icon-wrap-hue grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]">
        <Icon size={22} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-label text-fg">{headline}</p>
        <p className="font-caption text-pretty text-fg-muted">{subtext}</p>
      </div>
      <ArrowRight
        size={18}
        className="shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, MicVocal, ListOrdered, Layers, RotateCcw, BookOpen } from 'lucide-react'
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
      className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-[var(--hue-icon-bg)] p-5 transition-colors hover:bg-surface-sunken focus-ring"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-surface-raised text-[var(--primary)]">
        <Icon size={22} aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-body-sm font-semibold text-[var(--text-primary)]">{headline}</p>
        <p className="font-caption text-[var(--text-tertiary)]">{subtext}</p>
      </div>
      <ArrowRight size={18} className="text-[var(--text-tertiary)]" aria-hidden />
    </Link>
  )
}

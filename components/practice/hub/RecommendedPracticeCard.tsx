'use client'

// Planned structure:
// <RecommendedPracticeCard> — bento hero card (big number, SRS breakdown pills, word previews, CTAs, illustration)

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
import { RotateCcw, Sparkles, CheckCircle2 } from '@/components/icons'

interface Props {
  recommendation: RecommendedResult
}

export default function RecommendedPracticeCard({ recommendation }: Props) {
  const { mode, headline, subtext, reason } = recommendation

  // Extract number if headline starts with a number (e.g. "25 palabras esperan repaso")
  const match = headline.match(/^(\d+)\s*(.*)$/)
  const numberStr = match ? match[1] : null
  const restText = match ? match[2] : headline

  return (
    <div className="group relative flex flex-col justify-between gap-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm h-full overflow-hidden">
      <div className="flex flex-col gap-4 min-w-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">
            continúa donde lo dejaste
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-caption text-tiny font-medium text-fg-muted">
            <RotateCcw size={12} className="text-primary" aria-hidden />
            <span>Recomendado</span>
          </span>
        </div>

        {numberStr ? (
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 font-bold text-fg leading-snug">
              <span className="tabular-nums">{numberStr}</span>{' '}
              <span>{restText}</span>
            </h2>
            <p className="font-caption text-pretty text-fg-muted">unos 5 min · Repaso recomendado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 font-bold text-fg">{headline}</h2>
            <p className="font-caption text-pretty text-fg-muted">{subtext}</p>
          </div>
        )}

        {/* Middle content block: SRS breakdown + word preview chips */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-sunken/80 px-2 py-1 font-caption text-tiny text-fg-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>15 críticas</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-sunken/80 px-2 py-1 font-caption text-tiny text-fg-subtle">
              <CheckCircle2 size={12} className="text-success" aria-hidden />
              <span>94% retención</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {['receipt', 'refused', 'schedule'].map((word) => (
              <span
                key={word}
                className="inline-flex items-center rounded border border-border-subtle bg-surface-sunken/40 px-2 py-0.5 font-mono text-tiny text-fg-muted"
              >
                {word}
              </span>
            ))}
            {numberStr && parseInt(numberStr, 10) > 3 ? (
              <span className="font-caption text-tiny text-fg-subtle">
                +{parseInt(numberStr, 10) - 3} más
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 z-10 pt-2">
        <Link
          href={mode.href}
          onClick={() => void setLastPracticeMode(mode.id)}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 py-2.5 font-label font-semibold text-on-primary shadow-xs transition-transform duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          <Sparkles size={16} aria-hidden />
          <span>Empezar repaso</span>
        </Link>
        {reason === 'due-review' && (
          <Link
            href="/practice/essential-words"
            onClick={() => void setLastPracticeMode('essential-words')}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-4 py-2.5 font-label font-semibold text-fg transition-transform duration-150 hover:bg-surface-sunken active:scale-[0.98]"
          >
            <span>Ver cuáles</span>
          </Link>
        )}
      </div>

      {/* Stacked cards graphic illustration (bottom right) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-4 hidden sm:flex h-28 w-36 flex-col items-center justify-center rounded-xl border border-border-subtle/50 bg-surface-sunken/40 p-3 opacity-50 backdrop-blur-2xs transition-opacity group-hover:opacity-75"
      >
        <div className="relative h-16 w-24">
          <div className="absolute inset-0 rotate-[-6deg] rounded-lg border border-border-subtle bg-surface-raised shadow-xs" />
          <div className="absolute inset-0 rotate-[3deg] rounded-lg border border-border-subtle bg-surface-raised p-2 shadow-xs flex flex-col justify-between">
            <div className="h-1.5 w-10 rounded-full bg-primary/40" />
            <div className="h-1 w-14 rounded-full bg-border-strong/40" />
          </div>
        </div>
      </div>
    </div>
  )
}



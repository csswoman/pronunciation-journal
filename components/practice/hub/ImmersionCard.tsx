'use client'

// Planned structure:
// <ImmersionCard> — "Inmersión y conversación" bento card
//   header: kicker + title + description
//   footer: real "N de M vistas" progress (or tag chips when no data)
//   illustration: hand-drawn watermark, bottom-right

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import { getIllustration } from '@/lib/illustrations/registry'

const Illustration = getIllustration('domainListening')

interface Props {
  /** Dexie-backed count of lessons watched. null = unavailable/offline. */
  watchedCount: number | null
  /** Total immersion lessons available (from the server bundle). */
  totalCount: number
}

export default function ImmersionCard({ watchedCount, totalCount }: Props) {
  const hasProgress = watchedCount !== null && totalCount > 0

  return (
    <Link
      href="/practice/immersion"
      onClick={() => void setLastPracticeMode('immersion')}
      className="group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.99] focus-ring overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">libre</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Inmersión y conversación
          </h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Lecciones en video con nativos, fonética y minería de frases.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 z-10">
        {hasProgress ? (
          <span className="font-caption text-tiny text-fg-subtle">
            {watchedCount} de {totalCount} {totalCount === 1 ? 'lección vista' : 'lecciones vistas'}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {['video', 'fonética', 'frases'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 font-mono text-tiny text-fg-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-2 hidden text-primary/15 transition-colors duration-200 group-hover:text-primary/25 sm:block [&>svg]:h-20 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </Link>
  )
}

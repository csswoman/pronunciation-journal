'use client'

// Planned structure:
// <ReaderCard> — "Lectura en contexto" bento card
//   header: kicker + title
//   sample context sentence (illustrative UI copy)
//   footer: real recent-word count (hidden when 0)
//   illustration: hand-drawn watermark, bottom-right

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import { getIllustration } from '@/lib/illustrations/registry'

const Illustration = getIllustration('domainReading')

interface Props {
  /** Words in the bank that are ready to appear in the reader. */
  recentWordCount: number
}

export default function ReaderCard({ recentWordCount }: Props) {
  return (
    <Link
      href="/practice/reader"
      onClick={() => void setLastPracticeMode('reader')}
      className="group relative flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.99] focus-ring overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">libre</span>
        <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
          Lectura en contexto
        </h2>

        <div className="rounded-lg border border-border-subtle bg-surface-sunken/60 p-3 font-body-xs text-fg-muted leading-relaxed">
          She kept the{' '}
          <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/40">
            receipt
          </span>{' '}
          in her coat pocket, just in case the shop{' '}
          <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/40">
            refused
          </span>{' '}
          to take it back.
        </div>
      </div>

      {recentWordCount > 0 && (
        <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle pt-1 z-10">
          <span>
            Con tus {recentWordCount} {recentWordCount === 1 ? 'palabra reciente' : 'palabras recientes'}
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-2 hidden text-primary/15 transition-colors duration-200 group-hover:text-primary/25 sm:block [&>svg]:h-20 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </Link>
  )
}

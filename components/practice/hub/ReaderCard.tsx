'use client'

// Planned structure:
// <ReaderCard> — "Lectura en contexto" bento card (sentence snippet, recent words subtext)

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'

export default function ReaderCard() {
  return (
    <Link
      href="/practice/reader"
      onClick={() => void setLastPracticeMode('reader')}
      className="group relative flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-colors hover:border-border-strong focus-ring h-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <span className="font-kicker text-fg-subtle">libre</span>
        <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
          Lectura en contexto
        </h2>

        {/* Real context sentence snippet preview */}
        <div className="rounded-lg border border-border-subtle bg-surface-sunken/60 p-3 font-body-xs text-fg-muted leading-relaxed">
          She kept the <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/40">receipt</span> in her coat pocket, just in case the shop <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/40">refused</span> to take it back.
        </div>
      </div>

      <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle pt-1 z-10">
        <span>Con tus 25 palabras recientes</span>
      </div>

      {/* Document lines graphic illustration (bottom right) */}
      <div className="absolute right-4 bottom-3 hidden sm:flex flex-col gap-1 opacity-30 transition-opacity group-hover:opacity-60">
        <div className="h-2 w-8 rounded-full bg-border-strong" />
        <div className="h-2 w-6 rounded-full bg-border-strong" />
      </div>
    </Link>
  )
}

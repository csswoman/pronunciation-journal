'use client'

// Planned structure:
// <ImmersionCard> — "Inmersión y conversación" bento card (kicker libre, tags, video player graphic)

import Link from 'next/link'
import { Play } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'

export default function ImmersionCard() {
  return (
    <Link
      href="/practice/immersion"
      onClick={() => void setLastPracticeMode('immersion')}
      className="group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-colors hover:border-border-strong focus-ring h-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <span className="font-kicker text-fg-subtle">libre</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Inmersión y conversación
          </h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Lecciones en video con profesores nativos, fonética y minería de frases.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 font-mono text-tiny text-fg-subtle">
            video
          </span>
          <span className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 font-mono text-tiny text-fg-subtle">
            fonética
          </span>
          <span className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 font-mono text-tiny text-fg-subtle">
            frases
          </span>
        </div>
      </div>

      {/* Video player graphic illustration (bottom right) */}
      <div className="absolute right-4 bottom-4 hidden sm:flex h-16 w-24 flex-col items-center justify-center rounded-lg border border-border-subtle/50 bg-surface-sunken/60 opacity-50 transition-opacity group-hover:opacity-80">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary">
          <Play size={14} className="fill-current ml-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

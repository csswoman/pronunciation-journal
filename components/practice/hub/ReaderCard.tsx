'use client'

// Planned structure:
// <ReaderCard> — "Lectura en contexto" dark card
//   Header: LECTURA kicker + "{recentWordCount} palabras tuyas" badge
//   Title: Lectura en contexto
//   Sample sentence with highlighted target words (receipt in butter, refused in coral)
//   Actions: "Leer más" blue pill button + subtext

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { ArrowRight } from '@/components/icons'

interface Props {
  recentWordCount: number
}

export default function ReaderCard({ recentWordCount }: Props) {
  const wordsText = recentWordCount > 0 ? `${recentWordCount} palabras tuyas` : 'Sin palabras guardadas'

  return (
    <div className="group relative flex flex-col justify-between gap-5 rounded-3xl border border-border-default bg-surface-raised p-5 shadow-sm transition-all duration-200 hover:border-border-strong overflow-hidden select-none">
      <div className="flex flex-col gap-3.5 z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted select-none">
            LECTURA
          </span>
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-sans text-caption font-bold text-fg-muted">
            {wordsText}
          </span>
        </div>

        <h2 className="font-heading text-h3 font-extrabold text-fg leading-tight">
          Lectura en contexto
        </h2>

        {/* Oración de ejemplo con palabras clave destacadas e inclinadas */}
        <div className="rounded-2xl border border-border-subtle bg-surface-sunken p-4.5 font-sans text-body-sm sm:text-body-md font-medium text-fg leading-relaxed">
          She kept the{' '}
          <span className="inline-block -rotate-1 transform rounded-md bg-butter px-1.5 py-0.5 font-heading text-body-sm font-extrabold text-ink shadow-2xs">
            receipt
          </span>{' '}
          in her coat pocket, just in case the shop{' '}
          <span className="inline-block rotate-1 transform rounded-md bg-coral px-1.5 py-0.5 font-heading text-body-sm font-extrabold text-ink shadow-2xs">
            refused
          </span>{' '}
          to take it back.
        </div>
      </div>

      <div className="flex items-center pt-1 z-10">
        <Link
          href="/practice/reader"
          onClick={() => void setLastPracticeMode('reader')}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-label text-body-sm font-bold text-on-primary shadow-xs transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] select-none shrink-0"
        >
          <span>Leer más</span>
          <ArrowRight className="size-4 shrink-0 text-on-primary" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

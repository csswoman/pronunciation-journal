'use client'

// Planned structure:
// <ReaderCard> — "Lectura en contexto" dark card
//   Header: LECTURA kicker + "{recentWordCount} palabras tuyas" badge
//   Title: Lectura en contexto
//   Recent words from the learner's word bank
//   Actions: "Leer más" blue pill button + subtext

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { ArrowRight } from '@/components/icons'

interface Props {
  recentWordCount: number
  recentWords: string[]
}

export default function ReaderCard({ recentWordCount, recentWords }: Props) {
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

        {recentWords.length > 0 ? (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle bg-surface-sunken p-3.5" aria-label="Palabras recientes para practicar">
            {recentWords.map((word) => (
              <span key={word} className="rounded-md bg-surface-raised px-2 py-1 font-heading text-body-sm font-bold text-fg">
                {word}
              </span>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-border-subtle bg-surface-sunken p-3.5 font-sans text-body-sm text-fg-muted">
            Guarda algunas palabras para crear lecturas en torno a tu vocabulario.
          </p>
        )}
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

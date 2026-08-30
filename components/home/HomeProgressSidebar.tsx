'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

// Planned structure:
// <HomeProgressSidebar>
//   <section "Tu progreso">
//     <Palabras esenciales · Nivel: X de 740 + progress bar>
//     <Filas clave-valor: En repaso (X palabras) + Racha (Y días)>
//   </section>
//   <section "Te tocan hoy">
//     <Chips de palabras + restante>
//   </section>
// </HomeProgressSidebar>

const CEFR_WORD_TOTALS: Record<string, number> = {
  A1: 740,
  A2: 1150,
  B1: 1800,
  B2: 2400,
}

export interface HomeProgressSidebarProps {
  profileLevel?: string | null
  streak?: number | null
  wordsDueCount?: number
  soundsDueCount?: number
  previewWords?: Array<{ text: string }>
}

export default function HomeProgressSidebar({
  profileLevel = 'A1',
  streak = 0,
  wordsDueCount = 0,
  soundsDueCount = 0,
  previewWords = [],
}: HomeProgressSidebarProps) {
  const levelKey = (profileLevel || 'A1').toUpperCase()
  const totalLevelWords = CEFR_WORD_TOTALS[levelKey] ?? 740

  const learnedCount =
    useLiveQuery(async () => {
      try {
        const count = await db.srsData
          .filter((item) => (item.interval ?? 0) > 0 && !item.archived)
          .count()
        return Math.max(1, count)
      } catch {
        return 1
      }
    }, []) ?? 1

  const progressPercent = Math.min(
    100,
    Math.round((learnedCount / totalLevelWords) * 100),
  )

  const totalDue = wordsDueCount + soundsDueCount
  const remainingChips = Math.max(0, totalDue - previewWords.length)

  return (
    <aside
      className="flex min-w-0 flex-col gap-6"
      aria-label="Tu progreso y tareas de hoy"
    >
      {/* Tarjeta única: Tu progreso */}
      <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-raised p-5 shadow-sm motion-reduce:shadow-none">
        <h2 className="font-heading text-body-md font-bold text-fg">
          Tu progreso
        </h2>

        {/* Palabras esenciales */}
        <Link
          href="/practice/essential-words"
          className="focus-ring group flex flex-col gap-2 rounded-lg transition-opacity hover:opacity-85"
        >
          <span className="font-label text-[13px] text-fg-muted">
            Palabras esenciales · {levelKey}
          </span>
          <p className="font-sans text-2xl font-bold tabular-nums text-fg">
            {learnedCount}{' '}
            <span className="font-body-sm font-normal text-fg-muted">
              de {totalLevelWords}
            </span>
          </p>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuenow={learnedCount}
            aria-valuemin={0}
            aria-valuemax={totalLevelWords}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none"
              style={{ width: `${Math.max(2, progressPercent)}%` }}
            />
          </div>
        </Link>

        {/* Filas de datos estructurados */}
        <div className="flex flex-col gap-2.5 border-t border-border-subtle/50 pt-3">
          <Link
            href="/review"
            className="focus-ring flex items-baseline justify-between transition-opacity hover:opacity-85"
          >
            <span className="font-body-sm text-fg-muted">En repaso</span>
            <span className="font-sans text-body-md font-bold tabular-nums text-fg">
              {totalDue} {totalDue === 1 ? 'palabra' : 'palabras'}
            </span>
          </Link>

          <div className="flex items-baseline justify-between">
            <span className="font-body-sm text-fg-muted">Racha</span>
            <span className="font-sans text-body-md font-bold tabular-nums text-fg">
              {streak ?? 0} {streak === 1 ? 'día' : 'días'}
            </span>
          </div>
        </div>
      </div>

      {/* Bloque: Te tocan hoy */}
      <section className="flex flex-col gap-3" aria-label="Te tocan hoy">
        <h3 className="font-label text-[13px] font-semibold text-fg-muted">
          Te tocan hoy
        </h3>
        {previewWords.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {previewWords.map((item) => (
              <span
                key={item.text}
                className="rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 font-mono-code text-body-sm font-medium text-fg"
              >
                {item.text}
              </span>
            ))}
            {remainingChips > 0 ? (
              <span className="font-mono-code text-body-sm font-medium text-fg-muted">
                +{remainingChips}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="font-body-sm text-fg-muted">Todo al día por hoy.</p>
        )}
      </section>
    </aside>
  )
}

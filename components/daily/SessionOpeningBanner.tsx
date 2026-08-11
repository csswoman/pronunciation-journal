'use client'

// Planned structure:
// <SessionOpeningBanner>
//   IPA hero + topic label
//   Core 1000 quiet meter (when learned > 0)
// </SessionOpeningBanner>
//
// Opening framing for the daily session. Core 1000 progress is Dexie-only, read
// live from IndexedDB (offline-safe). Renders nothing when there is no framing data.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import type { SessionArc } from '@/lib/practice/types'

const ESSENTIAL_WORD_TARGET = 1000

interface Props {
  arc: SessionArc | undefined
}

export default function SessionOpeningBanner({ arc }: Props) {
  const { user } = useAuth()
  const learned = useLiveQuery(
    () => user?.id ? db.srsData.filter((e) => e.userId === user.id && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX)).count() : 0,
    [user?.id],
    0,
  )

  const hasFraming = !!(arc?.topicLabel || arc?.soundIpa) || (learned ?? 0) > 0
  if (!hasFraming) return null

  const learnedCount = learned ?? 0
  const progressPct = Math.min(100, (learnedCount / ESSENTIAL_WORD_TARGET) * 100)
  const soundIpa = formatIpaDisplay(arc?.soundIpa)
  const topicLabel = arc?.topicLabel

  return (
    <div className="mb-[var(--layout-section-gap)] flex flex-col gap-[var(--layout-stack)]">
      {(topicLabel || soundIpa) && (
        <div className="flex items-end gap-3">
          {soundIpa ? (
            <p
              className="font-ipa shrink-0 text-display-ipa font-bold leading-none text-primary"
              aria-label={`Sonido del día ${soundIpa}`}
            >
              {soundIpa}
            </p>
          ) : null}
          <div className="min-w-0 pb-0.5">
            <p className="font-label text-balance text-fg">
              {topicLabel ?? (soundIpa ? 'Sonido del día' : null)}
            </p>
            {topicLabel && soundIpa ? (
              <p className="font-caption text-fg-muted">Sonido del día</p>
            ) : null}
          </div>
        </div>
      )}
      {learnedCount > 0 && (
        <div
          role="group"
          aria-label={`Palabras esenciales, ${learnedCount} de ${ESSENTIAL_WORD_TARGET}`}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <p className="font-caption text-fg-muted">Palabras esenciales</p>
            <p className="font-caption tabular-nums text-fg">
              <span className="font-semibold">{learnedCount}</span>
              <span className="text-fg-muted"> / {ESSENTIAL_WORD_TARGET}</span>
            </p>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={ESSENTIAL_WORD_TARGET}
            aria-valuenow={learnedCount}
            aria-label="Progreso de palabras esenciales"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

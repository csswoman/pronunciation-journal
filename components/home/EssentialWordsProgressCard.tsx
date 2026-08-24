'use client'

// Planned structure:
// <EssentialWordsProgressCard>
//   <LearningFocusStrip /> — "Tu nivel" + Cambiar
//   loading |
//   copy stack (title + fraction + meta + CTA)
//   decorative CEFR outline mark
// </EssentialWordsProgressCard>

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight } from '@/components/icons'
import { db, ensureDbReady } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'
import { fetchLevelIndex } from '@/lib/essential-words/level-index-client'
import {
  frontierLevelProgress,
  levelSlideCaption,
  tallyLevelProgress,
  type LevelTallyWord,
} from '@/lib/essential-words/level-progress'
import { useAuth } from '@/components/auth/AuthProvider'
import LearningFocusStrip from '@/components/home/LearningFocusStrip'

/** Below this, promote a stronger CTA — early-route signal, not a nav tile. */
const EARLY_PROGRESS_THRESHOLD = 50

interface EssentialWordsProgressCardProps {
  /** Threaded to the "Tu foco" strip so it can derive the suggested level. */
  profileLevel?: string | null
}

export default function EssentialWordsProgressCard({
  profileLevel = null,
}: EssentialWordsProgressCardProps) {
  const { user } = useAuth()
  const [words, setWords] = useState<LevelTallyWord[] | null>(null)

  const learnedIds = useLiveQuery(
    async () => {
      try {
        await ensureDbReady()
        if (!user?.id) return [] as string[]
        return db.srsData
          .filter(
            (e) =>
              e.userId === user.id && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX),
          )
          .primaryKeys()
      } catch {
        return [] as string[]
      }
    },
    [user?.id],
  )

  useEffect(() => {
    let cancelled = false
    fetchLevelIndex()
      .then((w) => {
        if (!cancelled) setWords(w)
      })
      .catch(() => {
        /* wait for data */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const learned = learnedIds?.length ?? 0
  const rows =
    words && learnedIds
      ? tallyLevelProgress(words, new Set(learnedIds as string[]))
      : null
  const active = rows ? frontierLevelProgress(rows) : null

  if (learnedIds === undefined) {
    return (
      <div className="home-sidebar-card flex flex-col gap-2" aria-hidden>
        <div className="h-3 w-16 animate-pulse rounded bg-surface-sunken" />
        <div className="h-5 w-40 animate-pulse rounded bg-surface-sunken" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
      </div>
    )
  }

  const early = learned < EARLY_PROGRESS_THRESHOLD
  const ctaLabel = active
    ? early
      ? 'Practicar ahora'
      : 'Seguir practicando'
    : 'Abrir palabras esenciales'

  return (
    <div className="home-sidebar-card home-sidebar-card--featured ew-progress-card">
      <LearningFocusStrip profileLevel={profileLevel} />
      <div className="ew-progress-card__face">
        <div className="ew-progress-card__copy">
          <span className="font-label text-fg">Palabras esenciales</span>
          {active ? (
            <>
              <p className="ew-progress-card__fraction">
                <span className="ew-progress-card__learned">
                  {active.learned}/
                </span>
                <span className="ew-progress-card__total">{active.total}</span>
              </p>
              <div
                className="ew-progress-card__bar"
                role="progressbar"
                aria-valuenow={active.learned}
                aria-valuemin={0}
                aria-valuemax={active.total}
                aria-label={`${active.learned} de ${active.total} palabras en ${active.level}`}
              >
                <span
                  className="ew-progress-card__bar-fill"
                  style={{
                    width: `max(8px, calc(${
                      active.total > 0
                        ? Math.min(100, (active.learned / active.total) * 100)
                        : 0
                    }% ))`,
                  }}
                />
              </div>
              <p className="ew-progress-card__meta">
                {levelSlideCaption(active)}
              </p>
            </>
          ) : (
            <p className="font-body-sm text-fg-muted">Cargando progreso…</p>
          )}

          <Link
            href="/practice/essential-words"
            className="ew-progress-card__cta focus-ring relative z-[1] mt-1 inline-flex min-h-10 w-fit items-center gap-1.5 rounded-sm font-body-sm font-medium hover:underline"
            aria-label={
              active
                ? `${ctaLabel}: ${active.level}, ${active.learned} de ${active.total} palabras`
                : ctaLabel
            }
          >
            {ctaLabel} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>

      {active ? (
        <span className="ew-progress-card__level" data-outline="" aria-hidden>
          {active.level}
        </span>
      ) : null}
    </div>
  )
}

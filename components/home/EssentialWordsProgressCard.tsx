'use client'

// Planned structure:
// <EssentialWordsProgressCard>
//   loading |
//   <LevelSlider>
//     centered copy stack (title + fraction + meta + CTA)
//     decorative outline mark (data-outline + text-stroke)
//     prev/next (visible on hover / focus / touch)
//   </LevelSlider>
// </EssentialWordsProgressCard>

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, ChevronLeft, ChevronRight } from '@/components/icons'
import { db, ensureDbReady } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'
import { fetchLevelIndex } from '@/lib/essential-words/level-index-client'
import {
  frontierLevelProgress,
  levelSlideCaption,
  tallyLevelProgress,
  type LevelProgress,
  type LevelTallyWord,
} from '@/lib/essential-words/level-progress'
import { useAuth } from '@/components/auth/AuthProvider'

/** Below this, promote a stronger CTA — early-route signal, not a nav tile. */
const EARLY_PROGRESS_THRESHOLD = 50
const SLIDE_MS = 4500

export default function EssentialWordsProgressCard() {
  const { user } = useAuth()
  const [words, setWords] = useState<LevelTallyWord[] | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [frontierSeeded, setFrontierSeeded] = useState(false)

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
  const rows: LevelProgress[] | null = words && learnedIds
    ? tallyLevelProgress(words, new Set(learnedIds as string[]))
    : null
  const levels = rows?.filter((row) => row.total > 0) ?? []
  const frontier = rows ? frontierLevelProgress(rows) : null

  useEffect(() => {
    if (frontierSeeded || !frontier || !rows) return
    const withContent = rows.filter((row) => row.total > 0)
    const i = withContent.findIndex((row) => row.level === frontier.level)
    setSlideIndex(i >= 0 ? i : 0)
    setFrontierSeeded(true)
  }, [frontier, frontierSeeded, rows])

  useEffect(() => {
    if (paused || levels.length < 2) return
    if (typeof window !== 'undefined') {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (reduce.matches) return
    }
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % levels.length)
    }, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [levels.length, paused])

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

  const active =
    levels.length > 0
      ? levels[Math.min(slideIndex, levels.length - 1)]
      : frontier
  const canSlide = levels.length > 1
  const ctaLabel = active
    ? early
      ? `Seguir en ${active.level}`
      : `Practicar ${active.level}`
    : 'Abrir palabras esenciales'

  const go = (delta: number) => {
    if (!canSlide) return
    setSlideIndex((i) => (i + delta + levels.length) % levels.length)
  }

  return (
    <div
      className="home-sidebar-card home-sidebar-card--featured ew-progress-card group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div className="ew-progress-card__face">
        <div className="ew-progress-card__copy">
          <span className="font-label text-fg">Vocabulario</span>
          {active ? (
            <>
              <p className="font-body-sm font-semibold text-fg">
                {active.learned >= active.total
                  ? `Completado: ${active.level}`
                  : `Repasando: ${active.level}`}
              </p>
              <p className="ew-progress-card__fraction" aria-live="polite">
                <span className="ew-progress-card__learned">
                  {active.learned}/
                </span>
                <span className="ew-progress-card__total">{active.total}</span>
              </p>
              <p className="ew-progress-card__meta">
                {levelSlideCaption(active)}
              </p>
            </>
          ) : (
            <p className="font-body-sm text-fg-muted">Cargando progreso…</p>
          )}

          <Link
            href="/practice/essential-words"
            className="focus-ring relative z-[1] mt-1 inline-flex min-h-10 w-fit items-center gap-1.5 rounded-sm font-body-sm font-medium text-fg-muted hover:text-fg hover:underline"
            aria-label={
              active
                ? `${ctaLabel}: ${active.learned} de ${active.total} palabras`
                : ctaLabel
            }
          >
            {ctaLabel} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>

      {active ? (
        <span
          className="ew-progress-card__level"
          data-outline={active.level}
          aria-hidden
        >
          {active.level}
        </span>
      ) : null}

      {canSlide ? (
        <div className="ew-progress-card__nav">
          <button
            type="button"
            className="ew-progress-card__nav-btn focus-ring"
            aria-label="Nivel anterior"
            onClick={() => go(-1)}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="ew-progress-card__nav-btn focus-ring"
            aria-label="Nivel siguiente"
            onClick={() => go(1)}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}

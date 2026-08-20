'use client'

// Planned structure:
// <HomePlanDone>
//   recap + streak
//   <HomeSpeakPrompt />
//   <recommended practice link />
// </HomePlanDone>

import Link from 'next/link'
import { ArrowRight, Flame } from '@/components/icons'
import HomeSpeakPrompt from '@/components/home/HomeSpeakPrompt'
import { resolveRecommendedMode } from '@/lib/practice/practice-modes'
import type { SessionArc } from '@/lib/practice/types'
import { setLastPracticeMode } from '@/lib/db'

interface Props {
  stepCount: number
  arc: SessionArc | undefined
  /** Current streak days; null/undefined when unavailable. */
  streak?: number | null
}

function streakLine(streak: number | null | undefined): string | null {
  if (streak == null) return null
  if (streak <= 0) return 'Primer día de racha — vuelve mañana para sumar.'
  if (streak === 1) return '1 día seguido'
  return `${streak} días seguidos`
}

function localizeRecommendation(arc: SessionArc | undefined): {
  href: string
  modeId: string
  headline: string
  subtext: string
} {
  const result = resolveRecommendedMode({ fromDaily: true, arc, lastModeId: null })
  if (result.reason === 'daily-sound' && arc?.soundIpa) {
    return {
      href: result.mode.href,
      modeId: result.mode.id,
      headline: `Sigue con /${arc.soundIpa}/`,
      subtext: 'Refuerza el sonido del plan de hoy.',
    }
  }
  return {
    href: result.mode.href,
    modeId: result.mode.id,
    headline: 'Sigue con palabras esenciales',
    subtext: 'Continúa donde lo dejaste hoy.',
  }
}

/** Post-plan surface: celebrate, speak, one free-practice recommendation. */
export default function HomePlanDone({ stepCount, arc, streak = null }: Props) {
  const streakText = streakLine(streak)
  const rec = localizeRecommendation(arc)

  return (
    <div className="animate-state-in flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="animate-step-done grid h-12 w-12 place-items-center rounded-full bg-accent-2-soft text-accent-2">
          <Flame size={24} aria-hidden />
        </div>
        <p className="font-label font-semibold text-fg">¡Plan completo!</p>
        <p className="font-body-sm max-w-xs text-pretty text-fg-muted">
          Terminaste los {stepCount} pasos de hoy.
          {streakText ? (
            <>
              {" · "}
              <span className="font-medium text-accent-2">{streakText}</span>
            </>
          ) : null}
        </p>
      </div>

      <HomeSpeakPrompt arc={arc} />

      <Link
        href={rec.href}
        onClick={() => void setLastPracticeMode(rec.modeId)}
        className="focus-ring group flex items-center gap-3 rounded-xl border border-border-subtle bg-primary-soft/40 px-4 py-3.5 transition-colors hover:bg-primary-soft"
      >
        <div className="min-w-0 flex-1 text-left">
          <p className="font-label text-fg">{rec.headline}</p>
          <p className="font-caption mt-0.5 text-pretty text-fg-muted">{rec.subtext}</p>
        </div>
        <ArrowRight
          size={18}
          className="shrink-0 text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  )
}

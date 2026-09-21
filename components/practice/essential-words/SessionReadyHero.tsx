'use client'

import { useEffect, useState } from 'react'
import type { SessionSizeId } from '@/lib/essential-words/session-size'
import type { EssentialWordsSessionPreview } from '@/lib/essential-words/action-session'
import type { LastEssentialWordsSession } from '@/lib/essential-words/ready-last-session'
import { cn } from '@/lib/cn'
import PastelCard from '@/components/layout/PastelCard'
import Button from '@/components/ui/Button'
import { SessionReadyRecap } from './SessionReadyRecap'
import { SessionReadyRouteChips } from './SessionReadyRouteChips'
import { SessionReadySizePicker } from './SessionReadySizePicker'

interface WordChip {
  word: string
  ipa: string
}

interface Props {
  preview: EssentialWordsSessionPreview
  isResume: boolean
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
  onDiscard: () => void
  previewLoading: boolean
  lastSession?: LastEssentialWordsSession | null
  startingWords?: WordChip[]
}

const DEFAULT_STARTING_WORDS: WordChip[] = [
  { word: 'be', ipa: '/bi/' },
  { word: 'the', ipa: '/ðə/' },
  { word: 'have', ipa: '/hæv/' },
]

const ROTATE_CLASSES = ['-rotate-2', 'rotate-1', '-rotate-1']

function breakdownLine(preview: EssentialWordsSessionPreview, isResume: boolean): string | null {
  if (isResume) {
    return `${preview.remainingActions} ${preview.remainingActions === 1 ? 'ejercicio pendiente' : 'ejercicios pendientes'}`
  }
  const parts: string[] = []
  if (preview.newWordCount > 0) parts.push(`${preview.newWordCount} ${preview.newWordCount === 1 ? 'palabra nueva' : 'palabras nuevas'}`)
  if (preview.reviewActionCount > 0) parts.push(`${preview.reviewActionCount} ${preview.reviewActionCount === 1 ? 'repaso' : 'repasos'}`)
  if (preview.continuationActionCount > 0) parts.push(`${preview.continuationActionCount} ${preview.continuationActionCount === 1 ? 'acción en curso' : 'acciones en curso'}`)
  if (parts.length === 0) return null
  return parts.join(' · ')
}

export function SessionReadyHero({
  preview,
  isResume,
  activeRouteId,
  onRouteChange,
  sessionSize,
  onSessionSizeChange,
  onBegin,
  onDiscard,
  previewLoading,
  lastSession,
  startingWords = DEFAULT_STARTING_WORDS,
}: Props) {
  const [showRoutePicker, setShowRoutePicker] = useState(false)
  const minutes = Math.max(1, Math.round(preview.estimatedDurationMs / 60000))
  const breakdown = breakdownLine(preview, isResume)
  const scheduledCount = isResume ? preview.remainingActions : preview.scheduledActions
  const title = isResume
    ? 'Continuar donde lo dejaste'
    : `Hoy tienes ${scheduledCount} ${scheduledCount === 1 ? 'ejercicio' : 'ejercicios'}`
  const ctaLabel = isResume ? 'Continuar' : 'Empezar'

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (previewLoading) return
      if (event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (isInput) return

      if (event.key === 'Enter') {
        event.preventDefault()
        onBegin()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBegin, previewLoading])

  const wordsToShow = startingWords.length > 0 ? startingWords.slice(0, 3) : DEFAULT_STARTING_WORDS

  return (
    <PastelCard
      tone="coral"
      className="p-6 sm:p-8 flex flex-col gap-6 shadow-md relative overflow-hidden animate-home-in"
    >
      {/* Wave pattern decoration SVG */}
      <svg
        className="absolute bottom-0 right-0 pointer-events-none opacity-15 text-ink/20 w-56 h-28"
        viewBox="0 0 240 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M0 90C40 60 80 110 120 80C160 50 200 100 240 70V120H0V90Z"
          fill="currentColor"
        />
        <path
          d="M0 100C50 80 90 120 130 95C170 70 210 110 240 85V120H0V100Z"
          fill="currentColor"
          opacity="0.5"
        />
      </svg>

      {/* Top row: Subheader & Last Session */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-widest text-ink-secondary uppercase">
          SESIÓN DE HOY
        </span>
        {lastSession ? (
          <div className="text-xs sm:text-sm font-semibold text-ink-secondary">
            <SessionReadyRecap session={lastSession} />
          </div>
        ) : (
          <span className="text-xs sm:text-sm font-semibold text-ink-secondary">
            Última: sin fallos · 1/1 · 0:42
          </span>
        )}
      </div>

      {/* Main Indicator: Big number on left, column on right */}
      <div>
        <h2 id="session-ready-title" className="sr-only">
          {title}
        </h2>
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="text-7xl sm:text-8xl font-black leading-none text-ink tracking-tight shrink-0">
            {scheduledCount}
          </span>
          <div className="flex flex-col justify-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
              {scheduledCount === 1 ? 'ejercicio' : 'ejercicios'}
            </span>
            <p className="text-sm sm:text-base font-medium text-ink-secondary mt-1">
              {breakdown ? <span>{breakdown}</span> : null}
              {breakdown ? ' · ' : ''}
              <span>{minutes} min</span>
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <div className="w-full h-px bg-ink/10 my-1" />

      {/* Selector: CUÁNTO QUIERES HOY */}
      <div>
        <span className="text-xs font-bold tracking-widest text-ink-secondary uppercase mb-2.5 block">
          CUÁNTO QUIERES HOY
        </span>
        <SessionReadySizePicker
          value={sessionSize}
          onChange={onSessionSizeChange}
          disabled={isResume}
        />
      </div>

      {/* EMPIEZAS CON: Micro-flashcard style */}
      <div>
        <span className="text-xs font-bold tracking-widest text-ink-secondary uppercase mb-2.5 block">
          EMPIEZAS CON
        </span>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {wordsToShow.map((card, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col justify-center rounded-xl border border-ink/20 bg-paper px-3.5 py-1.5 shadow-xs transition-transform duration-200 select-none",
                ROTATE_CLASSES[idx % ROTATE_CLASSES.length]
              )}
            >
              <span className="font-heading text-sm sm:text-base font-extrabold leading-tight text-ink">
                {card.word}
              </span>
              <span className="font-phoneme text-caption font-medium leading-tight text-ink-muted">
                {card.ipa}
              </span>
            </div>
          ))}
          <span className="text-xs sm:text-sm font-medium text-ink-secondary ml-1 self-center">
            +2 · completar, elegir y escuchar
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4 pt-2 relative z-10">
        <Button
          variant="ej-ink"
          size="lg"
          onClick={onBegin}
          disabled={previewLoading}
          isLoading={previewLoading}
          aria-label={previewLoading ? 'Actualizando…' : ctaLabel}
          className="min-w-[140px] sm:min-w-[160px] justify-center shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          data-cuelume-press="press"
          data-cuelume-release="release"
          icon={!previewLoading ? <span aria-hidden>→</span> : null}
          iconPosition="right"
        >
          {ctaLabel}
        </Button>

        <button
          type="button"
          onClick={() => setShowRoutePicker((prev) => !prev)}
          disabled={isResume}
          className="text-sm font-bold text-ink underline underline-offset-4 hover:text-ink-secondary cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
        >
          Cambiar el orden
        </button>

        {isResume && (
          <button
            type="button"
            onClick={onDiscard}
            className="text-xs sm:text-sm font-bold text-ink-secondary hover:text-ink underline underline-offset-4 cursor-pointer ml-auto"
          >
            Descartar sesión
          </button>
        )}
      </div>

      {/* Route picker */}
      {showRoutePicker && (
        <div className="pt-2 animate-fadeIn">
          <SessionReadyRouteChips
            activeRouteId={activeRouteId}
            onRouteChange={onRouteChange}
            disabled={isResume}
          />
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {previewLoading ? 'Actualizando sesión' : ''}
      </p>
    </PastelCard>
  )
}

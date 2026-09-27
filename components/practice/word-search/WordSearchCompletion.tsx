'use client'

// Planned structure:
// <WordSearchCompletion>
//   <CelebrationHeroCard> (Left column: watermark 8/8, TABLERO COMPLETADO badge, stats chips, actions)
//   <WordsReviewPanel>   (Right column: "Escúchalas antes de seguir", 2-col words grid, Guardar cuaderno banner)
// </WordSearchCompletion>

import { useEffect, useRef, useState } from 'react'
import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import { getWordColorTheme } from '@/lib/exercises/word-search/word-colors'
import { WORD_SEARCH_MODE_LABELS } from '@/lib/exercises/word-search/mode-labels'
import { recordWordSearchRepetition } from '@/lib/word-bank/domain-queries'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { speakText, cancelSpeech } from '@/lib/speech/synthesis'
import { PillButton } from '@/components/ui/PillButton'
import { ArrowRight, Play, RotateCcw, Volume2 } from '@/components/icons'
import WordSearchSaveWordsButton from './WordSearchSaveWordsButton'

interface WordSearchCompletionProps {
  puzzle: WordSearchPuzzle
  elapsedSeconds: number
  formatTime: (seconds: number) => string
  onRepeat: () => void
  onExit: () => void
}

export default function WordSearchCompletion({
  puzzle,
  elapsedSeconds,
  formatTime,
  onRepeat,
  onExit,
}: WordSearchCompletionProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const hasRecordedRef = useRef(false)
  const hasRecordedActivityRef = useRef(false)
  const modeLabel = WORD_SEARCH_MODE_LABELS[puzzle.mode]

  useEffect(() => {
    if (!user?.id || hasRecordedRef.current || puzzle.source !== 'word_bank') return
    hasRecordedRef.current = true

    const items = puzzle.items.map((item) => ({
      id: item.id,
      word: item.word,
      clue: item.clue,
    }))

    void recordWordSearchRepetition(user.id, items)
      .catch((err) => console.warn('[WordSearchCompletion] record error', err))
  }, [user?.id, puzzle, elapsedSeconds])

  useEffect(() => {
    if (!user?.id || hasRecordedActivityRef.current) return
    hasRecordedActivityRef.current = true
    void recordGameActivity(user.id, 'word_search', elapsedSeconds * 1000, puzzle.id)
      .catch((err) => console.warn('[WordSearchCompletion] activity record failed', err))
  }, [elapsedSeconds, puzzle.id, user?.id])

  const handlePlayAll = () => {
    cancelSpeech()
    puzzle.items.forEach((item, index) => {
      window.setTimeout(() => {
        speakText(item.displayWord)
      }, index * 1200)
    })
  }

  return (
    <section
      className="grid w-full items-stretch gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
      aria-label="Resultados de la partida"
    >
      {/* Left Column: Celebration Hero Card */}
      <div className="relative flex min-h-[30rem] flex-col justify-between overflow-hidden rounded-3xl border border-emerald-400/40 bg-[#a8e6c9] p-6 text-[#12151c] shadow-sm dark:border-emerald-800 dark:bg-[#1b4332] dark:text-emerald-50">
        <span
          className="pointer-events-none absolute -right-4 -top-6 select-none font-heading text-[140px] font-black leading-none text-black/5 dark:text-white/5"
          aria-hidden
        >
          {puzzle.items.length}/{puzzle.items.length}
        </span>

        <div className="relative flex flex-col items-start gap-4">
          <span className="inline-flex items-center rounded-full bg-[#12151c] px-3.5 py-1 font-mono text-tiny font-bold uppercase tracking-wider text-white dark:bg-emerald-300 dark:text-emerald-950">
            TABLERO COMPLETADO
          </span>

          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-3xl font-extrabold leading-tight text-[#12151c] sm:text-4xl dark:text-emerald-50">
              ¡Encontraste todas las palabras!
            </h2>
            <p className="text-body-sm leading-relaxed text-[#374151] dark:text-emerald-200/90">
              Terminaste «<span className="font-bold">{puzzle.title}</span>». Ahora escúchalas: así las recordarás por el sonido, no solo por la forma.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2.5 pt-2">
            <div className="flex flex-col items-start gap-0.5 rounded-2xl bg-white/80 p-3 shadow-2xs dark:bg-emerald-900/60">
              <span className="font-mono text-tiny font-bold uppercase tracking-wider text-black/60 dark:text-emerald-300">
                PALABRAS
              </span>
              <span className="font-mono text-body-md font-extrabold text-[#12151c] dark:text-emerald-50">
                {puzzle.items.length}/{puzzle.items.length}
              </span>
            </div>

            <div className="flex flex-col items-start gap-0.5 rounded-2xl bg-white/80 p-3 shadow-2xs dark:bg-emerald-900/60">
              <span className="font-mono text-tiny font-bold uppercase tracking-wider text-black/60 dark:text-emerald-300">
                TIEMPO
              </span>
              <span className="font-mono text-body-md font-extrabold text-[#12151c] dark:text-emerald-50">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            <div className="flex flex-col items-start gap-0.5 rounded-2xl bg-white/80 p-3 shadow-2xs dark:bg-emerald-900/60">
              <span className="font-mono text-tiny font-bold uppercase tracking-wider text-black/60 dark:text-emerald-300">
                MODO
              </span>
              <span className="text-caption font-bold text-[#12151c] dark:text-emerald-50 truncate w-full">
                {modeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-2.5 pt-6">
          <button
            type="button"
            onClick={onExit}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-[#12151c] px-6 py-3.5 text-body-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] hover:bg-black dark:bg-emerald-300 dark:text-emerald-950"
          >
            <span>Elegir otro tema</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

          <button
            type="button"
            onClick={onRepeat}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white/80 px-6 py-3.5 text-body-sm font-bold text-[#12151c] shadow-2xs transition-all active:scale-[0.98] hover:bg-white dark:bg-surface-sunken dark:text-fg dark:border-border-subtle"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            <span>Repetir este tablero</span>
          </button>
        </div>
      </div>

      {/* Right Column: Words Review Panel */}
      <div className="flex w-full min-w-0 flex-col justify-between gap-5 rounded-3xl border border-border-subtle bg-surface-raised p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
              LAS {puzzle.items.length} PALABRAS DE ESTE TABLERO
            </span>
            <h3 className="font-heading text-2xl font-bold text-fg">
              Escúchalas antes de seguir
            </h3>
          </div>

          <PillButton
            variant="outline"
            size="sm"
            onClick={handlePlayAll}
            className="rounded-full px-4 py-2 font-bold hover:bg-surface-sunken"
          >
            <Play className="h-3.5 w-3.5 fill-current me-1.5" aria-hidden />
            Escuchar todas
          </PillButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[24rem] pr-1 scrollbar-thin">
          {puzzle.items.map((item, index) => {
            const colorTheme = getWordColorTheme(index)
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle/80 bg-surface-sunken/60 p-3.5 shadow-2xs transition-colors hover:bg-surface-sunken"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorTheme.iconBg}`}
                    aria-hidden
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-bold text-body-sm text-fg" lang="en">
                        {item.displayWord}
                      </span>
                      {item.ipa ? (
                        <span className="font-ipa text-caption text-fg-muted">{item.ipa}</span>
                      ) : null}
                    </div>
                    <span className="text-caption text-fg-subtle truncate">
                      {item.meaningEs || item.clue}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speakText(item.displayWord)}
                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-base border border-border-subtle text-fg-muted hover:text-fg hover:bg-surface-raised transition-colors"
                  aria-label={`Escuchar ${item.displayWord}`}
                >
                  <Volume2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#fef3c7] dark:bg-amber-950/60 border border-[#fde68a] dark:border-amber-700/60 p-4 shadow-2xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-body-md font-bold text-[#78350f] dark:text-amber-200">
              Guárdalas en tu cuaderno
            </span>
            <span className="text-caption text-[#92400e] dark:text-amber-300/80">
              Volverán en tu repaso para que no se te olviden.
            </span>
          </div>

          <WordSearchSaveWordsButton items={puzzle.items} puzzleTitle={puzzle.title} />
        </div>
      </div>
    </section>
  )
}

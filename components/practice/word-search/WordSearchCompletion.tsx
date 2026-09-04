'use client'

// Planned structure:
// <WordSearchCompletion>
//   <IllustrationBanner />  (celebration burst icon with subtle soft halo)
//   <HeaderGroup />         (kicker badge, title, subtitle)
//   <StatsBar />            (words count, elapsed time, mode label)
//   <FoundWordsSection>     (interactive chips with displayWord, IPA, and ListenButton)
//   <ActionGroup />         (Elegir otro tema primary CTA, Repetir tablero secondary CTA)
// </WordSearchCompletion>

import { useEffect, useRef, useState } from 'react'
import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import { getWordColorTheme } from '@/lib/exercises/word-search/word-colors'
import { getIllustration } from '@/lib/illustrations/registry'
import { recordWordSearchRepetition } from '@/lib/word-bank/domain-queries'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { ListenButton } from '@/components/ui/ListenButton'
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles } from '@/components/icons'

interface WordSearchCompletionProps {
  puzzle: WordSearchPuzzle
  elapsedSeconds: number
  formatTime: (seconds: number) => string
  onRepeat: () => void
  onExit: () => void
}

function playWordAudio(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
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
  const [recordedCount, setRecordedCount] = useState<number | null>(null)
  const hasRecordedRef = useRef(false)
  const Illustration = getIllustration('stateCompletado')
  const modeLabel = puzzle.mode === 'classic' ? 'Lista visible' : 'Con pistas'

  useEffect(() => {
    if (!user?.id || hasRecordedRef.current || puzzle.source !== 'word_bank') return
    hasRecordedRef.current = true

    const items = puzzle.items.map((item) => ({
      id: item.id,
      word: item.word,
      clue: item.clue,
    }))

    void recordWordSearchRepetition(user.id, items, elapsedSeconds * 1000)
      .then((count) => setRecordedCount(count))
      .catch((err) => console.warn('[WordSearchCompletion] record error', err))
  }, [user?.id, puzzle, elapsedSeconds])

  return (
    <section
      className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 rounded-lg border border-border-subtle bg-surface-raised p-6 text-center shadow-sm transition-all duration-200 md:gap-8 md:p-10"
      aria-label="Resultados de la partida"
    >
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full bg-success-soft opacity-70 blur-xl"
          aria-hidden
        />
        <div className="relative flex h-24 w-24 items-center justify-center text-success md:h-28 md:w-28">
          <Illustration className="h-full w-auto" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-caption font-medium text-success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            <span>Partida completada</span>
          </div>
          {recordedCount !== null && recordedCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-caption font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>{recordedCount} palabras repasadas en SRS (+XP)</span>
            </div>
          )}
        </div>
        <h2 className="text-balance text-h2 font-bold text-fg">
          ¡Encontraste todas las palabras!
        </h2>
        <p className="max-w-md text-pretty text-body-sm text-fg-muted">
          Completaste “<span className="font-semibold text-fg">{puzzle.title}</span>” en{' '}
          <span className="font-mono font-semibold tabular-nums text-fg">
            {formatTime(elapsedSeconds)}
          </span>
          . Escucha las palabras para afinar tu oído antes de continuar.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 divide-x divide-border-subtle rounded-md bg-surface-sunken p-3 text-center">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-caption text-fg-subtle">Palabras</span>
          <span className="font-mono text-label font-semibold tabular-nums text-fg">
            {puzzle.items.length} / {puzzle.items.length}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-caption text-fg-subtle">Tiempo</span>
          <span className="font-mono text-label font-semibold tabular-nums text-fg">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-caption text-fg-subtle">Modo</span>
          <span className="text-caption font-medium text-fg">{modeLabel}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <h3 className="text-caption font-semibold tracking-wider text-fg-muted uppercase">
          Palabras descubiertas
        </h3>
        <div
          className="flex flex-wrap justify-center gap-2 md:gap-2.5"
          aria-label="Palabras encontradas"
        >
          {puzzle.items.map((item, index) => {
            const colorTheme = getWordColorTheme(index)
            return (
              <div
                key={item.id}
                className={`inline-flex items-center gap-2 rounded-lg border ${colorTheme.cardBorder} ${colorTheme.badgeBg} ps-3.5 pe-1 py-1 text-caption font-medium text-fg shadow-xs transition-colors`}
              >
                <span className="font-semibold">{item.displayWord}</span>
                {item.ipa ? (
                  <span className="font-ipa text-caption text-fg-muted">
                    {item.ipa}
                  </span>
                ) : null}
                <ListenButton
                  iconOnly
                  label={`Escuchar ${item.displayWord}`}
                  onPlay={() => playWordAudio(item.word)}
                  className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 text-fg-muted hover:text-primary"
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
        <Button variant="secondary" onClick={onRepeat}>
          <RotateCcw className="me-1.5 h-4 w-4" aria-hidden />
          <span>Repetir tablero</span>
        </Button>
        <Button variant="primary" onClick={onExit}>
          <ArrowLeft className="me-1.5 h-4 w-4" aria-hidden />
          <span>Elegir otro tema</span>
        </Button>
      </div>
    </section>
  )
}

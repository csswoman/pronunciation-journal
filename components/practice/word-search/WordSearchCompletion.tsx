'use client'

// Planned structure:
// <WordSearchCompletion>
//   <VictoryIllustrationGroup /> (win.svg con halo suave y escala generosa)
//   <CompletionBadgeGroup />     (badge de victoria y refuerzo SRS si aplica)
//   <HeadingGroup />             (título y subtítulo claros con voz activa)
//   <StatsMetricsGroup />        (cápsula Inset Grouped de 3 columnas: palabras, tiempo, modo)
//   <VocabularyConsolidated />   (chips táctiles de vocabulario con audio y transcripción IPA)
//   <ActionGroup />              (Elegir nuevo tema primary CTA, Repetir tablero secondary CTA)
// </WordSearchCompletion>

import { useEffect, useRef, useState } from 'react'
import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import { getWordColorTheme } from '@/lib/exercises/word-search/word-colors'
import { getIllustration } from '@/lib/illustrations/registry'
import { recordWordSearchRepetition } from '@/lib/word-bank/domain-queries'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { ListenButton } from '@/components/ui/ListenButton'
import { CheckCircle2, RotateCcw, Sparkles } from '@/components/icons'

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
  const Illustration = getIllustration('stateWin')
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
      className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 text-center shadow-xs transition-all duration-200 md:gap-7 md:p-9"
      aria-label="Resultados de la partida"
    >
      <div className="relative flex items-center justify-center pt-2">
        <div
          className="absolute inset-0 scale-125 rounded-full bg-primary-soft/60 opacity-80 blur-2xl"
          aria-hidden
        />
        <div className="relative flex h-32 w-auto items-center justify-center text-primary sm:h-40">
          <Illustration className="h-full w-auto" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-caption font-bold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            <span>¡Tablero completado!</span>
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
          <span className="font-mono font-bold tabular-nums text-fg">
            {formatTime(elapsedSeconds)}
          </span>
          . Escucha cada palabra para afinar tu pronunciación antes de continuar.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 divide-x divide-border-subtle rounded-xl border border-border-subtle/80 bg-surface-sunken p-3 text-center shadow-2xs">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-caption text-fg-subtle">Palabras</span>
          <span className="font-mono text-label font-bold tabular-nums text-fg">
            {puzzle.items.length} / {puzzle.items.length}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-caption text-fg-subtle">Tiempo</span>
          <span className="font-mono text-label font-bold tabular-nums text-fg">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-caption text-fg-subtle">Modo</span>
          <span className="text-caption font-semibold text-fg">{modeLabel}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <div className="flex flex-col items-center gap-0.5">
          <h3 className="text-label font-bold text-fg">Vocabulario consolidado</h3>
          <p className="text-caption text-fg-muted">
            Toca el altavoz para escuchar la pronunciación y su sonido IPA:
          </p>
        </div>

        <div
          className="flex flex-wrap justify-center gap-2 md:gap-2.5"
          aria-label="Palabras encontradas"
        >
          {puzzle.items.map((item, index) => {
            const colorTheme = getWordColorTheme(index)
            return (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-sunken ps-3 pe-1.5 py-1.5 text-caption font-medium text-fg shadow-2xs transition-colors hover:border-border-default hover:bg-surface-base"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${colorTheme.iconBg}`}
                  aria-hidden
                />
                <span className="font-bold">{item.displayWord}</span>
                {item.ipa ? (
                  <span className="font-ipa text-caption text-fg-muted">
                    {item.ipa}
                  </span>
                ) : null}
                <ListenButton
                  iconOnly
                  label={`Escuchar ${item.displayWord}`}
                  onPlay={() => playWordAudio(item.word)}
                  className="min-h-11 min-w-11 sm:min-h-7 sm:min-w-7 text-fg-muted hover:text-fg"
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:gap-3 pt-1">
        <Button variant="secondary" onClick={onRepeat} className="w-full sm:w-auto">
          <RotateCcw className="me-1.5 h-4 w-4" aria-hidden />
          <span>Repetir este tablero</span>
        </Button>
        <Button variant="primary" onClick={onExit} className="w-full sm:w-auto">
          <Sparkles className="me-1.5 h-4 w-4" aria-hidden />
          <span>Elegir nuevo tema</span>
        </Button>
      </div>
    </section>
  )
}

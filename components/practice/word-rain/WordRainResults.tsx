'use client'

// Planned structure:
// <WordRainResults>
//   <ResultsHeader>
//     <StatusBadge />
//     <HeadingTitle />
//   </ResultsHeader>
//   <StatsMetricsGrid>
//     <StatCard (Palabras) />
//     <StatCard (Puntos) />
//     <StatCard (Racha) />
//     <StatCard (Precisión) />
//   </StatsMetricsGrid>
//   <SavedWordsReviewList>
//     <ReviewListHeader />
//     <ReviewListItems />
//   </SavedWordsReviewList>
//   <ResultsActions>
//     <PlayAgainButton />
//     <ExitButton />
//   </ResultsActions>
// </WordRainResults>

import { useState } from 'react'
import type { RainWord, WordRainStats } from '@/lib/exercises/word-rain/types'
import { quickAddWord } from '@/lib/word-bank/queries'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { CheckCircle2, RotateCcw, Volume2, Sparkles, Plus, Check } from '@/components/icons'

interface WordRainResultsProps {
  isVictory: boolean
  stats: WordRainStats
  savedWords: RainWord[]
  onRestart: () => void
  onExit: () => void
}

function playSpeech(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export default function WordRainResults({
  isVictory,
  stats,
  savedWords,
  onRestart,
  onExit,
}: WordRainResultsProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const [addedWords, setAddedWords] = useState<Record<string, boolean>>({})
  const [isAddingAll, setIsAddingAll] = useState(false)

  const handleSaveToBank = async (word: string) => {
    if (!user || addedWords[word]) return
    try {
      await quickAddWord({ text: word, source: 'manual' })
      setAddedWords((prev) => ({ ...prev, [word]: true }))
    } catch (err) {
      console.warn('[WordRainResults] Error adding word to bank:', err)
      // Even if already saved or duplicate, mark as saved in UI
      setAddedWords((prev) => ({ ...prev, [word]: true }))
    }
  }

  const handleSaveAllToBank = async () => {
    if (!user || isAddingAll) return
    setIsAddingAll(true)
    for (const item of savedWords) {
      if (!addedWords[item.word]) {
        try {
          await quickAddWord({ text: item.word, source: 'manual' })
          setAddedWords((prev) => ({ ...prev, [item.word]: true }))
        } catch {
          setAddedWords((prev) => ({ ...prev, [item.word]: true }))
        }
      }
    }
    setIsAddingAll(false)
  }

  return (
    <section
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 text-center shadow-xs md:p-8"
      aria-label="Resultados de la partida"
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold ${
            isVictory
              ? 'bg-success-soft text-success'
              : 'bg-primary-soft text-primary'
          }`}
        >
          {isVictory ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
          <span>{isVictory ? '¡Nivel superado!' : '¡Buen intento!'}</span>
        </div>
        <h2 className="text-h2 font-bold text-fg">
          {isVictory ? '¡Completaste la lluvia de palabras!' : 'Partida terminada'}
        </h2>
        <p className="text-body-sm text-fg-muted">
          Has atrapado y guardado {savedWords.length} palabras durante la sesión.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-surface-sunken/40 p-3">
          <span className="font-kicker text-tiny uppercase text-fg-subtle">Guardadas</span>
          <span className="font-mono text-h3 font-bold text-fg tabular-nums">
            {stats.wordsCompleted}
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-surface-sunken/40 p-3">
          <span className="font-kicker text-tiny uppercase text-fg-subtle">Puntos</span>
          <span className="font-mono text-h3 font-bold text-primary tabular-nums">
            {stats.score}
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-surface-sunken/40 p-3">
          <span className="font-kicker text-tiny uppercase text-fg-subtle">Racha máx</span>
          <span className="font-mono text-h3 font-bold text-fg tabular-nums">
            {stats.maxStreak}
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-surface-sunken/40 p-3">
          <span className="font-kicker text-tiny uppercase text-fg-subtle">Precisión</span>
          <span className="font-mono text-h3 font-bold text-fg tabular-nums">
            {stats.accuracy}%
          </span>
        </div>
      </div>

      {/* Lista de palabras guardadas */}
      <div className="flex w-full flex-col gap-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-body-sm font-semibold text-fg">
            Palabras recolectadas ({savedWords.length})
          </h3>
          {user && savedWords.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAllToBank}
              disabled={isAddingAll}
              className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:text-primary-hover focus-ring"
            >
              <Plus size={14} />
              Guardar todas en Vocabulario
            </button>
          )}
        </div>

        <div className="flex max-h-48 w-full flex-wrap gap-2 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-3">
          {savedWords.map((item, idx) => {
            const isSaved = addedWords[item.word]
            return (
              <div
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-raised px-2.5 py-1 text-caption font-medium text-fg shadow-2xs"
              >
                <span>{item.word}</span>
                {item.ipa && (
                  <span className="font-ipa text-tiny text-fg-subtle">
                    {item.ipa}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => playSpeech(item.word)}
                  className="text-fg-subtle hover:text-primary transition-colors focus-ring"
                  title={`Escuchar ${item.word}`}
                  aria-label={`Escuchar ${item.word}`}
                >
                  <Volume2 size={12} />
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => handleSaveToBank(item.word)}
                    disabled={isSaved}
                    className="text-fg-subtle hover:text-primary transition-colors focus-ring ml-0.5"
                    title={isSaved ? 'Guardada en vocabulario' : 'Añadir a mi vocabulario'}
                    aria-label={isSaved ? 'Guardada en vocabulario' : 'Añadir a mi vocabulario'}
                  >
                    {isSaved ? (
                      <Check size={12} className="text-success" />
                    ) : (
                      <Plus size={12} />
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
        <Button
          variant="primary"
          onClick={onRestart}
          className="w-full sm:flex-1 justify-center"
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>Jugar de nuevo</span>
        </Button>
        <Button
          variant="secondary"
          onClick={onExit}
          className="w-full sm:w-auto justify-center"
        >
          Salir al catálogo
        </Button>
      </div>
    </section>
  )
}

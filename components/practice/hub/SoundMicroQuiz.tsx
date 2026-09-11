'use client'

// Planned structure:
// <SoundMicroQuiz category>
//   one row: circular play button + two phoneme options + refresh
//   feedback line, only after answering
// </SoundMicroQuiz>

import { useState, useCallback, useEffect } from 'react'
import { Play, RefreshCw } from '@/components/icons'
import { speakText } from '@/lib/speech/synthesis'
import { cn } from '@/lib/cn'
import { QUICK_SOUND_QUIZZES, type SoundCategory } from '@/lib/practice/quick-sound-quizzes'

export type { SoundCategory }

interface Props {
  category: SoundCategory
  /** Bumped by the parent when the category filter changes, to reset the quiz. */
  resetKey: number
}

export default function SoundMicroQuiz({ category, resetKey }: Props) {
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const filteredQuizzes = QUICK_SOUND_QUIZZES.filter(
    (q) => category === 'all' || q.category === category,
  )
  const currentQuiz = filteredQuizzes[quizIndex % filteredQuizzes.length] || QUICK_SOUND_QUIZZES[0]

  // Reset the running quiz whenever the parent's category filter changes.
  useEffect(() => {
    setQuizIndex(0)
    setSelectedAnswer(null)
  }, [resetKey])

  const handlePlaySound = useCallback((word: string) => {
    setIsPlayingAudio(true)
    speakText(word, {
      rate: 0.82,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    })
  }, [])

  const handleSelectAnswer = useCallback((phoneme: string) => {
    setSelectedAnswer(phoneme)
  }, [])

  const handleNextQuiz = useCallback(() => {
    setSelectedAnswer(null)
    setQuizIndex((prev) => (prev + 1) % filteredQuizzes.length)
  }, [filteredQuizzes.length])

  // Keyboard shortcuts (power users): Space plays, 1/2 answer, N/O/→ next.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        handlePlaySound(currentQuiz.word)
      } else if (e.key === '1' || e.key.toLowerCase() === 'a') {
        e.preventDefault()
        handleSelectAnswer(currentQuiz.phoneme)
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        e.preventDefault()
        handleSelectAnswer(currentQuiz.distractorPhoneme)
      } else if (e.key === 'n' || e.key.toLowerCase() === 'o' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextQuiz()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuiz, handlePlaySound, handleSelectAnswer, handleNextQuiz])

  return (
    <div className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-surface-sunken/70 p-3">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => handlePlaySound(currentQuiz.word)}
          aria-label={`Escuchar pronunciación de ${currentQuiz.word} (tecla espacio)`}
          className={cn(
            'focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full border transition-all duration-200 active:scale-95',
            isPlayingAudio
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-border-default bg-surface-raised text-primary hover:border-primary/50 hover:shadow-sm',
          )}
        >
          {isPlayingAudio ? (
            <span className="flex items-end gap-0.5" aria-hidden="true">
              <span className="h-2.5 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-4 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2.5 w-1 rounded-full bg-primary animate-bounce" />
            </span>
          ) : (
            <Play size={18} className="translate-x-px fill-current" aria-hidden="true" />
          )}
        </button>

        <div className="grid flex-1 grid-cols-2 gap-2" role="group" aria-label="¿Cuál escuchaste?">
          <button
            type="button"
            onClick={() => handleSelectAnswer(currentQuiz.phoneme)}
            aria-label={`Fonema ${currentQuiz.phoneme}, como en ${currentQuiz.word}`}
            className={cn(
              'focus-ring flex min-h-12 flex-col items-center justify-center rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition-all duration-150 active:scale-95',
              selectedAnswer === currentQuiz.phoneme
                ? 'border-success bg-success-soft text-success'
                : selectedAnswer === currentQuiz.distractorPhoneme
                  ? 'border-success/60 bg-success-soft/30 text-fg'
                  : 'border-border-subtle bg-surface-raised text-fg hover:border-primary/40',
            )}
          >
            <span className="font-ipa text-body-sm font-bold">{currentQuiz.phoneme}</span>
            <span className="text-tiny text-fg-muted">{currentQuiz.word}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAnswer(currentQuiz.distractorPhoneme)}
            aria-label={`Fonema ${currentQuiz.distractorPhoneme}, como en ${currentQuiz.distractor}`}
            className={cn(
              'focus-ring flex min-h-12 flex-col items-center justify-center rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition-all duration-150 active:scale-95',
              selectedAnswer === currentQuiz.distractorPhoneme
                ? 'border-warning bg-warning-soft text-warning'
                : 'border-border-subtle bg-surface-raised text-fg hover:border-primary/40',
            )}
          >
            <span className="font-ipa text-body-sm font-bold">{currentQuiz.distractorPhoneme}</span>
            <span className="text-tiny text-fg-muted">{currentQuiz.distractor}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleNextQuiz}
          title="Otro par de sonidos (tecla N)"
          aria-label="Otro par de sonidos (tecla N)"
          className="focus-ring grid h-11 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-fg-subtle transition-colors hover:text-primary active:scale-95"
        >
          <RefreshCw size={15} aria-hidden="true" />
        </button>
      </div>

      {selectedAnswer ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'text-tiny text-pretty animate-fadeIn',
            selectedAnswer === currentQuiz.phoneme ? 'text-success' : 'text-fg-muted',
          )}
        >
          {selectedAnswer === currentQuiz.phoneme ? (
            currentQuiz.explanation
          ) : (
            <>
              Era <span className="font-ipa font-bold">{currentQuiz.phoneme}</span>. {currentQuiz.mouthTip}
            </>
          )}
        </p>
      ) : null}
    </div>
  )

}

'use client'

// Planned structure:
// <SoundMicroQuiz category>
//   header: label + "probar otro" button
//   play button (native pronunciation)
//   two phoneme options (keyboard: 1/2)
//   instant feedback with articulation tip
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
    <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border-default bg-surface-base p-4 shadow-xs transition-all">
      <div className="flex items-center justify-between text-caption">
        <span className="font-mono text-tiny font-semibold uppercase text-fg-subtle">
          Micro-reto: ¿Cuál escuchaste?
        </span>
        <button
          type="button"
          onClick={handleNextQuiz}
          className="focus-ring inline-flex items-center gap-1 text-tiny text-fg-subtle transition-colors hover:text-primary active:scale-95"
          title="Cambiar par fonético (Tecla N)"
        >
          <RefreshCw size={12} className="transition-transform hover:rotate-180 duration-300" aria-hidden />
          <span>Probar otro</span>
          <kbd className="hidden sm:inline-block rounded bg-surface-sunken px-1 font-mono text-[10px] text-fg-subtle">N</kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handlePlaySound(currentQuiz.word)}
          className={cn(
            'focus-ring flex h-11 flex-1 items-center justify-center gap-2.5 rounded-xl border font-label font-medium transition-all duration-200 shadow-xs active:scale-[0.98]',
            isPlayingAudio
              ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
              : 'border-border-default bg-surface-raised text-fg hover:border-primary/50 hover:bg-surface-sunken hover:shadow-sm',
          )}
        >
          {isPlayingAudio ? (
            <div className="flex items-center gap-0.5">
              <span className="h-3 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-4 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-3 w-1 rounded-full bg-primary animate-bounce" />
            </div>
          ) : (
            <Play size={18} className="fill-current text-primary transition-transform group-hover:scale-110" aria-hidden />
          )}
          <span>Escuchar pronunciación nativa</span>
          <kbd className="hidden sm:inline-block rounded border border-border-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
            Space
          </kbd>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleSelectAnswer(currentQuiz.phoneme)}
          className={cn(
            'focus-ring relative flex min-h-12 flex-col items-center justify-center rounded-lg border p-2.5 transition-all duration-150 text-center active:scale-95',
            selectedAnswer === currentQuiz.phoneme
              ? 'border-success bg-success-soft text-success shadow-xs ring-2 ring-success/30 scale-[1.02]'
              : 'border-border-subtle bg-surface-sunken text-fg hover:border-border-default hover:bg-surface-raised hover:shadow-2xs',
          )}
        >
          <span className="font-ipa text-body-lg font-bold">{currentQuiz.phoneme}</span>
          <span className="text-tiny text-fg-muted">{currentQuiz.word}</span>
          <kbd className="absolute right-1.5 top-1.5 rounded border border-border-subtle bg-surface-base px-1 font-mono text-[9px] text-fg-subtle">
            1
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => handleSelectAnswer(currentQuiz.distractorPhoneme)}
          className={cn(
            'focus-ring relative flex min-h-12 flex-col items-center justify-center rounded-lg border p-2.5 transition-all duration-150 text-center active:scale-95',
            selectedAnswer === currentQuiz.distractorPhoneme
              ? 'border-warning bg-warning-soft text-warning shadow-xs ring-2 ring-warning/30 scale-[1.02]'
              : 'border-border-subtle bg-surface-sunken text-fg hover:border-border-default hover:bg-surface-raised hover:shadow-2xs',
          )}
        >
          <span className="font-ipa text-body-lg font-bold">{currentQuiz.distractorPhoneme}</span>
          <span className="text-tiny text-fg-muted">{currentQuiz.distractor}</span>
          <kbd className="absolute right-1.5 top-1.5 rounded border border-border-subtle bg-surface-base px-1 font-mono text-[9px] text-fg-subtle">
            2
          </kbd>
        </button>
      </div>

      {selectedAnswer ? (
        <div
          className={cn(
            'flex flex-col gap-1 rounded-lg p-2.5 text-caption font-medium transition-all duration-300 animate-fadeIn',
            selectedAnswer === currentQuiz.phoneme
              ? 'bg-success-soft/80 text-success border border-success/30'
              : 'bg-warning-soft/80 text-warning border border-warning/30',
          )}
        >
          {selectedAnswer === currentQuiz.phoneme ? (
            <p>{currentQuiz.explanation}</p>
          ) : (
            <>
              <p>
                Casi. Sonó <strong>{currentQuiz.word}</strong> con fonema{' '}
                <span className="font-ipa font-bold">{currentQuiz.phoneme}</span>.
              </p>
              <p className="text-tiny text-fg-muted font-normal">
                💡 <strong>Tip articulatorio:</strong> {currentQuiz.mouthTip}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

'use client'

// Planned structure:
// <SentenceContextExercise>
//   <SentencePromptCard>
//     <ListenButton />
//     <SentenceWithBlank />
//   </SentencePromptCard>
//   <OptionButton /> × n  (pill, numeric badge)
//   <DefinitionCard />
// </SentenceContextExercise>

import { useState, useRef, useEffect, useCallback } from 'react'
import { BookOpen, Check, X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { SentenceContextExercise as SentenceContextExerciseType, SentenceContextOption } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import { ListenButton } from '@/components/ui/ListenButton'

interface Props {
  exercise: SentenceContextExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function SentenceContextExercise({ exercise, onResult }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [state, setState] = useState<AnswerState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  useEffect(() => {
    setSelectedId(null)
    setState('idle')
    setIsPlaying(false)
    startMs.current = Date.now()
    window.speechSynthesis?.cancel()
  }, [exercise.id])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const handlePlay = useCallback(() => {
    if (isPlaying || typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(exercise.fullSentence)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    window.speechSynthesis.speak(utterance)
  }, [exercise.fullSentence, isPlaying])

  const handlePick = useCallback((opt: SentenceContextOption) => {
    if (state !== 'idle') return
    playTap()
    const isCorrect = opt.word.toLowerCase() === exercise.answer.toLowerCase()
    setSelectedId(opt.id)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect(); else playWrong()
    onResult(isCorrect, opt.word, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, opt.word),
    })
  }, [state, exercise, playTap, playCorrect, playWrong, onResult])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (state !== 'idle') return
      const idx = parseInt(e.key, 10) - 1
      if (idx >= 0 && idx < exercise.options.length) handlePick(exercise.options[idx])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [state, exercise.options, handlePick])

  const selectedOption = exercise.options.find((o) => o.id === selectedId)
  const correctOption = exercise.options.find((o) => o.word.toLowerCase() === exercise.answer.toLowerCase())

  return (
    <div className="flex w-full flex-col gap-5">
      <SentencePromptCard
        sentence={exercise.sentence}
        answer={exercise.answer}
        selectedWord={selectedOption?.word ?? null}
        answerState={state}
        isPlaying={isPlaying}
        onPlayAudio={handlePlay}
      />
      <div className="flex flex-col gap-3">
        {exercise.options.map((opt, index) => (
          <OptionButton
            key={opt.id}
            option={opt}
            index={index}
            isAnswer={opt.id === correctOption?.id}
            isSelected={opt.id === selectedId}
            answerState={state}
            onPick={handlePick}
          />
        ))}
      </div>
      {state !== 'idle' && exercise.definition && (
        <DefinitionCard word={exercise.answer} definition={exercise.definition} />
      )}
    </div>
  )
}

function SentencePromptCard({
  sentence,
  answer,
  selectedWord,
  answerState,
  isPlaying,
  onPlayAudio,
}: {
  sentence: string
  answer: string
  selectedWord: string | null
  answerState: AnswerState
  isPlaying: boolean
  onPlayAudio: () => void
}) {
  const done = answerState !== 'idle'
  const isCorrect = answerState === 'correct'
  const charCount = Math.max(3, answer.length)
  const parts = sentence.split('___')

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-sky-deep/30 bg-sky p-8 text-center shadow-2xs sm:p-10">
      <ListenButton
        onPlay={onPlayAudio}
        label={isPlaying ? 'Reproduciendo...' : 'Escuchar oración'}
        aria-label={isPlaying ? 'Reproduciendo oración completa' : 'Escuchar oración completa'}
        aria-pressed={isPlaying}
        className="border-2 border-ink bg-transparent text-ink"
      />

      <p className="flex flex-wrap items-center justify-center gap-2.5 font-display text-2xl font-bold leading-relaxed text-ink sm:gap-3 sm:text-3xl">
        <span>{parts[0]?.trimEnd()}</span>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-2xl px-4 py-1.5 align-baseline transition-all duration-200 select-none',
            !done && 'border-b-2 border-dashed border-ink/40 text-transparent',
            done && isCorrect && 'border border-mint-deep/60 bg-mint text-ink',
            done && !isCorrect && 'border border-coral-deep/60 bg-coral text-ink',
          )}
          style={{ minWidth: `max(4.5rem, calc(${charCount * 0.75}em + 1.5rem))` }}
        >
          {done ? (
            <span className="animate-in fade-in zoom-in-95 duration-200" aria-live="polite">
              {selectedWord}
            </span>
          ) : (
            <span className="font-mono text-lg opacity-40" aria-hidden>
              ___
            </span>
          )}
        </span>
        <span>{parts[1]?.trimStart()}</span>
      </p>
    </div>
  )
}

function OptionButton({
  option,
  index,
  isAnswer,
  isSelected,
  answerState,
  onPick,
}: {
  option: SentenceContextOption
  index: number
  isAnswer: boolean
  isSelected: boolean
  answerState: AnswerState
  onPick: (option: SentenceContextOption) => void
}) {
  const done = answerState !== 'idle'

  return (
    <button
      type="button"
      onClick={() => onPick(option)}
      disabled={done}
      aria-label={`${index + 1}. ${option.word}`}
      className={cn(
        'group flex min-h-13 w-full cursor-pointer items-center justify-between rounded-full border-2 px-4 py-3 text-left transition-all duration-150 select-none focus-ring',
        !done && 'border-transparent bg-[color-mix(in_oklch,var(--text)_7%,var(--surface-raised))] text-fg hover:bg-[color-mix(in_oklch,var(--text)_11%,var(--surface-raised))]',
        done && isAnswer && 'cursor-default border-success-border bg-success-soft font-semibold text-success dark:border-mint dark:bg-mint/20',
        done && isSelected && !isAnswer && 'cursor-default border-error-border bg-error-soft font-semibold text-error dark:border-coral dark:bg-coral/20',
        done && !isAnswer && !isSelected && 'cursor-default border-border-subtle bg-surface-sunken/30 text-fg-subtle opacity-40',
      )}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-body-sm font-semibold transition-colors',
            !done && 'border border-border-strong bg-surface-base text-fg-muted dark:bg-surface-raised',
            done && isAnswer && 'bg-feedback-correct font-bold text-on-accent shadow-xs',
            done && isSelected && !isAnswer && 'bg-feedback-wrong font-bold text-on-accent shadow-xs',
            done && !isAnswer && !isSelected && 'border border-border-subtle bg-surface-sunken text-fg-faint',
          )}
          aria-hidden
        >
          {index + 1}
        </span>
        <span className="text-body-lg font-medium">{option.word}</span>
      </div>
      {done && (
        <div className="shrink-0" aria-hidden="true">
          {isAnswer ? <Check size={20} className="text-success" /> : isSelected ? <X size={20} className="text-error" /> : null}
        </div>
      )}
    </button>
  )
}

function DefinitionCard({ word, definition }: { word: string; definition: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-surface-sunken/80 p-4 text-left shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
        <BookOpen size={18} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-tiny font-semibold tracking-wider text-fg-muted uppercase">
          Definición · <strong className="text-fg">{word}</strong>
        </span>
        <p className="text-body-sm leading-relaxed text-fg">{definition}</p>
      </div>
    </div>
  )
}

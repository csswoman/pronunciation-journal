'use client'

// Planned structure:
// <SentenceContextExercise>
//   <SentencePromptCard>
//     <AudioTrigger />     — clean listen button for context sentence
//     <SentenceDisplay />  — sentence with dynamic blank and animated reveal
//   </SentencePromptCard>
//   <OptionGrid>           — 4 options with keyboard shortcuts and check/x reveal
//     <OptionButton />
//   </OptionGrid>
//   <DefinitionCard />     — word definition revealed on answer
// </SentenceContextExercise>

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X, BookOpen } from '@/components/icons'
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
    const isCorrect = opt.word === exercise.answer
    setSelectedId(opt.id)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect(); else playWrong()

    onResult(isCorrect, opt.word, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, opt.word),
    })
  }, [state, exercise, onResult, playTap, playCorrect, playWrong])

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
      <OptionGrid
        options={exercise.options}
        answer={exercise.answer}
        selectedId={selectedId}
        answerState={state}
        onPick={handlePick}
      />
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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border-default bg-surface-sunken/40 p-5 text-center shadow-xs sm:p-6">
      <ListenButton
        onPlay={onPlayAudio}
        label={isPlaying ? 'Reproduciendo...' : 'Escuchar oración'}
        aria-label={isPlaying ? 'Reproduciendo oración completa' : 'Escuchar oración completa'}
        aria-pressed={isPlaying}
      />

      <p className="text-h3 font-medium leading-relaxed text-fg sm:text-h2">
        {parts[0]?.trimEnd()}
        <span
          className={cn(
            'relative inline-flex items-center justify-center mx-1.5 px-3 py-0.5 rounded-lg border transition-all duration-200 align-baseline',
            !done && 'border-dashed border-border-strong/80 bg-surface-base/60 text-transparent select-none shadow-2xs',
            done && isCorrect && 'border-success-border bg-success-soft text-success font-bold shadow-2xs',
            done && !isCorrect && 'border-error-border bg-error-soft text-error font-bold shadow-2xs',
          )}
          style={{ minWidth: `max(4.5rem, calc(${charCount * 0.75}em + 1.5rem))` }}
        >
          {done ? (
            <span className="animate-in fade-in zoom-in-95 duration-200" aria-live="polite">
              {selectedWord}
            </span>
          ) : (
            <span className="font-mono text-body-sm text-fg-subtle/40 tracking-widest" aria-hidden>&nbsp;</span>
          )}
        </span>
        {parts[1]?.trimStart()}
      </p>
    </div>
  )
}

function OptionGrid({
  options,
  answer,
  selectedId,
  answerState,
  onPick,
}: {
  options: SentenceContextOption[]
  answer: string
  selectedId: string | null
  answerState: AnswerState
  onPick: (opt: SentenceContextOption) => void
}) {
  const done = answerState !== 'idle'

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, idx) => {
        const isSelected = opt.id === selectedId
        const isAnswer = opt.word === answer

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPick(opt)}
            disabled={done}
            aria-label={`${idx + 1}. ${opt.word}`}
            className={cn(
              'group flex w-full min-h-13.5 items-center justify-between rounded-xl border p-4 transition-all duration-150 select-none text-left focus-ring',
              !done && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg cursor-pointer active:scale-[0.99]',
              done && isAnswer && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold cursor-default',
              done && isSelected && !isAnswer && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold cursor-default',
              done && !isAnswer && !isSelected && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
            )}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-tiny font-semibold transition-colors',
                  !done && 'border border-border-strong bg-surface-base text-fg-muted group-hover:border-primary/60 group-hover:text-primary',
                  done && isAnswer && 'border border-success bg-success-soft text-success',
                  done && isSelected && !isAnswer && 'border border-error bg-error-soft text-error',
                  done && !isAnswer && !isSelected && 'border border-border-subtle bg-surface-base text-fg-subtle opacity-60',
                )}
                aria-hidden
              >
                {idx + 1}
              </span>
              <span className="text-body-md font-medium">{opt.word}</span>
            </div>

            {done && (
              <div className="shrink-0">
                {isAnswer ? <Check size={20} className="text-success" /> : isSelected ? <X size={20} className="text-error" /> : null}
              </div>
            )}
          </button>
        )
      })}
    </div>
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


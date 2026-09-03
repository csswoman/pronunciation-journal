'use client'

// Planned structure:
// <SentenceContextExercise>
//   <SentencePromptCard>
//     <ListenButton />
//     <SentenceWithBlank />
//   </SentencePromptCard>
//   <MultipleChoiceBase (indicatorType="number") />
//   <DefinitionCard />
// </SentenceContextExercise>

import { useState, useRef, useEffect, useCallback } from 'react'
import { BookOpen } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { SentenceContextExercise as SentenceContextExerciseType, SentenceContextOption } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import { ListenButton } from '@/components/ui/ListenButton'
import { MultipleChoiceBase } from '@/components/exercises/MultipleChoiceBase'

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
  const choiceOptions = exercise.options.map((opt) => ({ id: opt.id, label: opt.word }))

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
      <MultipleChoiceBase
        options={choiceOptions}
        selectedId={selectedId}
        correctId={correctOption?.id ?? null}
        state={state}
        indicatorType="number"
        onSelect={(item) => {
          const opt = exercise.options.find((o) => o.id === item.id)
          if (opt) handlePick(opt)
        }}
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

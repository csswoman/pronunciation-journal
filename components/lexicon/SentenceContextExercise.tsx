'use client'

// Planned structure:
// <SentenceContextExercise>
//   <AudioPromptBar />   — play full sentence button
//   <SentencePrompt />   — sentence with highlighted blank
//   <OptionGrid />       — 4 word options (seleccionar → confirmar)
//   <ConfirmBar />       — confirm button (visible after selection)
//   <FeedbackPanel />    — post-confirm: full sentence + word definition

import { useState, useRef, useEffect } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { SentenceContextExercise as SentenceContextExerciseType, SentenceContextOption } from '@/lib/exercises/types'

interface Props {
  exercise: SentenceContextExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

type Phase = 'selecting' | 'feedback'

export function SentenceContextExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('selecting')
  const [isCorrect, setIsCorrect] = useState(false)
  const startMs = useRef(Date.now())

  useEffect(() => {
    setSelected(null)
    setPhase('selecting')
    setIsCorrect(false)
    startMs.current = Date.now()
  }, [exercise.id])

  function handleSelect(optionId: string) {
    if (phase !== 'selecting') return
    setSelected(optionId === selected ? null : optionId)
  }

  function handleConfirm() {
    if (!selected || phase !== 'selecting') return
    const selectedOption = exercise.options.find((o) => o.id === selected)
    const correct = selectedOption?.word === exercise.answer
    setIsCorrect(correct)
    setPhase('feedback')
    onSubmit(correct, selectedOption?.word ?? '')
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <AudioPromptBar sentence={exercise.fullSentence} word={exercise.answer} />
      <SentencePrompt sentence={exercise.sentence} />
      <OptionGrid
        options={exercise.options}
        answer={exercise.answer}
        selected={selected}
        phase={phase}
        onSelect={handleSelect}
      />
      {phase === 'selecting' && (
        <ConfirmBar disabled={!selected} onConfirm={handleConfirm} />
      )}
      {phase === 'feedback' && (
        <FeedbackPanel
          isCorrect={isCorrect}
          answer={exercise.answer}
          definition={exercise.definition}
          fullSentence={exercise.fullSentence}
        />
      )}
    </div>
  )
}

function AudioPromptBar({ sentence, word }: { sentence: string; word: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => speak(sentence)}
        className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        aria-label={`Listen to example sentence for ${word}`}
      >
        <Volume2 className="h-3.5 w-3.5 flex-shrink-0" />
        Play sentence
      </button>
      <p className="text-xs text-fg-subtle">Choose the word that completes the sentence</p>
    </div>
  )
}

function SentencePrompt({ sentence }: { sentence: string }) {
  const parts = sentence.split('___')
  return (
    <p className="text-base leading-relaxed text-fg">
      {parts[0]}
      <span className="inline-block min-w-[5rem] rounded-lg bg-primary-soft px-2 font-semibold text-primary">
        ___
      </span>
      {parts[1]}
    </p>
  )
}

interface OptionGridProps {
  options: SentenceContextOption[]
  answer: string
  selected: string | null
  phase: Phase
  onSelect: (id: string) => void
}

const DOT_COLORS = [
  'oklch(0.65 0.18 25)',
  'oklch(0.65 0.18 250)',
  'oklch(0.65 0.18 310)',
  'oklch(0.65 0.16 145)',
]

function OptionGrid({ options, answer, selected, phase, onSelect }: OptionGridProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, idx) => {
        const isSelected = opt.id === selected
        const isCorrectOption = opt.word === answer
        const done = phase === 'feedback'

        let borderColor = 'var(--border-default)'
        let bgColor = 'var(--surface-raised)'
        let dotColor = DOT_COLORS[idx % DOT_COLORS.length]

        if (isSelected && !done) { borderColor = 'var(--primary)'; bgColor = 'var(--primary-soft)' }
        if (done && isCorrectOption) { borderColor = 'var(--success-border)'; bgColor = 'var(--success-soft)'; dotColor = 'var(--success)' }
        if (done && isSelected && !isCorrectOption) { borderColor = 'var(--error-border)'; bgColor = 'var(--error-soft)'; dotColor = 'var(--error)' }

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            disabled={done}
            aria-pressed={isSelected}
            className={cn(
              'flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] font-medium transition-all duration-150',
              !done && 'cursor-pointer hover:border-[var(--border-hover)] active:scale-[0.99]',
              done && !isCorrectOption && !isSelected && 'cursor-default opacity-50',
              done && (isCorrectOption || isSelected) && 'cursor-default',
            )}
            style={{ backgroundColor: bgColor, borderColor }}
          >
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
            <span className="text-fg">{opt.word}</span>
          </button>
        )
      })}
    </div>
  )
}

function ConfirmBar({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={disabled}
      className={cn(
        'w-full rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-all',
        disabled
          ? 'cursor-not-allowed bg-surface-raised text-fg-subtle'
          : 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md hover:-translate-y-[1px]',
      )}
    >
      Confirm
    </button>
  )
}

interface FeedbackPanelProps {
  isCorrect: boolean
  answer: string
  definition: string
  fullSentence: string
}

function FeedbackPanel({ isCorrect, answer, definition, fullSentence }: FeedbackPanelProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm"
      style={{
        backgroundColor: isCorrect ? 'var(--success-soft)' : 'var(--error-soft)',
        borderColor: isCorrect ? 'var(--success-border)' : 'var(--error-border)',
      }}
    >
      <p className="font-semibold" style={{ color: isCorrect ? 'var(--success-value)' : 'var(--error-value)' }}>
        {isCorrect ? `✓ Correct — ${answer}` : `✗ The answer is "${answer}"`}
      </p>
      <p className="text-xs text-fg-muted italic leading-snug">"{fullSentence}"</p>
      <p className="text-xs text-fg-subtle leading-snug">{definition}</p>
      <button
        type="button"
        onClick={() => speak(fullSentence)}
        className="self-start flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
        aria-label={`Listen to ${answer}`}
      >
        <Volume2 className="h-3 w-3" />
        Listen again
      </button>
    </div>
  )
}

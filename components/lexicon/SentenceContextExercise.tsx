'use client'

// Planned structure:
// <SentenceContextExercise>
//   <AudioButton />      — centered large play button
//   <SentencePrompt />   — full sentence with blank as dashes below audio
//   <OptionGrid />       — clean border buttons, checkmark on correct
//   <ConfirmBar />       — shown after selection, before confirm

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/cn'
import type { SentenceContextExercise as SentenceContextExerciseType, SentenceContextOption } from '@/lib/exercises/types'

interface Props {
  exercise: SentenceContextExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}

type Phase = 'selecting' | 'confirmed'

export function SentenceContextExercise({ exercise, onResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('selecting')
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startMs = useRef(Date.now())

  useEffect(() => {
    setSelected(null)
    setPhase('selecting')
    setIsPlaying(false)
    startMs.current = Date.now()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    window.speechSynthesis?.cancel()
  }, [exercise.id])

  const handlePlay = useCallback(() => {
    if (isPlaying) return
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(exercise.fullSentence)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [exercise.fullSentence, isPlaying])

  function handleSelect(optionId: string) {
    if (phase !== 'selecting') return
    setSelected(optionId === selected ? null : optionId)
  }

  function handleConfirm() {
    if (!selected || phase !== 'selecting') return
    const selectedOption = exercise.options.find((o) => o.id === selected)
    const correct = selectedOption?.word === exercise.answer
    setPhase('confirmed')
    onResult(correct, selectedOption?.word ?? '', Date.now() - startMs.current)
  }

  const done = phase === 'confirmed'

  return (
    <div className="flex w-full flex-col gap-4">
      <AudioButton isPlaying={isPlaying} onPlay={handlePlay} />
      <SentencePrompt sentence={exercise.sentence} />
      <OptionGrid
        options={exercise.options}
        answer={exercise.answer}
        selected={selected}
        done={done}
        onSelect={handleSelect}
      />
      {!done && (
        <ConfirmBar disabled={!selected} onConfirm={handleConfirm} />
      )}
    </div>
  )
}

function AudioButton({ isPlaying, onPlay }: { isPlaying: boolean; onPlay: () => void }) {
  return (
    <div className="flex justify-center py-2">
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlaying}
        aria-label={isPlaying ? 'Playing sentence' : 'Play sentence'}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200',
          isPlaying
            ? 'cursor-wait border-border-default bg-surface-raised text-fg-subtle'
            : 'cursor-pointer border-border-default bg-surface-raised text-fg hover:border-border-strong hover:scale-105 active:scale-95',
        )}
      >
        {isPlaying ? <SoundWaveIcon /> : <SpeakerIcon />}
      </button>
    </div>
  )
}

function SpeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function SoundWaveIcon() {
  return (
    <svg width="22" height="18" viewBox="0 0 24 20" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="6" rx="1.5" opacity="0.5">
        <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="7;4;7" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="5.25" y="4" width="3" height="12" rx="1.5">
        <animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" begin="0.15s" />
        <animate attributeName="y" values="4;7;4" dur="0.8s" repeatCount="indefinite" begin="0.15s" />
      </rect>
      <rect x="10.5" y="1" width="3" height="18" rx="1.5">
        <animate attributeName="height" values="18;10;18" dur="0.8s" repeatCount="indefinite" begin="0.05s" />
        <animate attributeName="y" values="1;5;1" dur="0.8s" repeatCount="indefinite" begin="0.05s" />
      </rect>
      <rect x="15.75" y="4" width="3" height="12" rx="1.5">
        <animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
        <animate attributeName="y" values="4;7;4" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
      </rect>
      <rect x="21" y="7" width="3" height="6" rx="1.5" opacity="0.5">
        <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" begin="0.1s" />
        <animate attributeName="y" values="7;4;7" dur="0.8s" repeatCount="indefinite" begin="0.1s" />
      </rect>
    </svg>
  )
}

function SentencePrompt({ sentence }: { sentence: string }) {
  const parts = sentence.split('___')
  const wordCount = 4

  return (
    <p className="text-center text-lg leading-relaxed text-fg">
      {parts[0]}
      <span className="inline-flex items-end gap-0.75 mx-1.5 align-baseline" style={{ paddingBottom: '2px' }}>
        {Array.from({ length: wordCount }).map((_, i) => (
          <span key={i} className="inline-block h-px w-3.5 bg-border-strong" />
        ))}
      </span>
      {parts[1]?.trimStart()}
    </p>
  )
}

interface OptionGridProps {
  options: SentenceContextOption[]
  answer: string
  selected: string | null
  done: boolean
  onSelect: (id: string) => void
}

function OptionGrid({ options, answer, selected, done, onSelect }: OptionGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = opt.id === selected
        const isCorrectOption = opt.word === answer

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            disabled={done}
            aria-pressed={isSelected}
            className={cn(
              'w-full flex items-center justify-between rounded-(--radius-lg) border px-4 py-3.5 text-[15px] font-medium text-left min-h-13 transition-all duration-150',
              !done && !isSelected && 'border-border-default bg-surface-raised text-fg hover:border-border-strong cursor-pointer',
              !done && isSelected && 'border-primary bg-primary-soft text-primary cursor-pointer',
              done && isCorrectOption && 'border-success-border bg-success-soft text-success cursor-default',
              done && isSelected && !isCorrectOption && 'border-error-border bg-error-soft text-error cursor-default',
              done && !isCorrectOption && !isSelected && 'border-border-subtle bg-surface-raised text-fg-subtle opacity-50 cursor-default',
            )}
          >
            <span>{opt.word}</span>
            {done && isCorrectOption && (
              <span className="text-success text-base leading-none">✓</span>
            )}
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
        'w-full rounded-full py-3.5 text-[15px] font-semibold transition-all duration-150',
        disabled
          ? 'bg-surface-raised text-fg-subtle cursor-not-allowed'
          : 'bg-(--cta-bg) text-(--cta-fg) cursor-pointer hover:opacity-90 active:scale-[0.99]',
      )}
    >
      Check
    </button>
  )
}

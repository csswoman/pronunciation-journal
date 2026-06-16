'use client'

// Planned structure:
// <SentenceDictationExercise>
//   <PlayZone />       — centered play button with audio state
//   <AnswerInput />    — textarea for transcription
//   <SubmitButton />   — disabled until user types something
//   <FeedbackBar />    — correct/wrong + correct sentence after submission

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/cn'
import type { SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: SentenceDictationExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
}

export function SentenceDictationExercise({ exercise, onResult }: Props) {
  const [input, setInput] = useState('')
  const [state, setState] = useState<AnswerState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const startMs = useRef(Date.now())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setInput('')
    setState('idle')
    setIsPlaying(false)
    startMs.current = Date.now()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
  }, [exercise.id])

  const handlePlay = useCallback(() => {
    if (isPlaying) return

    if (exercise.audioUrl) {
      const audio = new Audio(exercise.audioUrl)
      audioRef.current = audio
      setIsPlaying(true)
      audio.play()
      audio.onended = () => { setIsPlaying(false); inputRef.current?.focus() }
      audio.onerror = () => setIsPlaying(false)
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(exercise.sentence)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => { setIsPlaying(false); inputRef.current?.focus() }
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [exercise.audioUrl, exercise.sentence, isPlaying])

  function handleSubmit() {
    if (state !== 'idle' || !input.trim()) return
    const isCorrect = normalize(input) === normalize(exercise.sentence)
    setState(isCorrect ? 'correct' : 'wrong')
    onResult(isCorrect, input.trim(), Date.now() - startMs.current)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const done = state !== 'idle'

  return (
    <div className="flex w-full flex-col gap-6">
      <PlayZone isPlaying={isPlaying} onPlay={handlePlay} />
      <AnswerInput
        inputRef={inputRef}
        value={input}
        disabled={done}
        onChange={setInput}
        onKeyDown={handleKeyDown}
      />
      {!done && (
        <SubmitButton disabled={!input.trim()} onSubmit={handleSubmit} />
      )}
      {done && (
        <FeedbackBar state={state} correctSentence={exercise.sentence} />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PlayZone({ isPlaying, onPlay }: { isPlaying: boolean; onPlay: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlaying}
        aria-label={isPlaying ? 'Playing sentence' : 'Play sentence'}
        className={cn(
          'group relative flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] transition-all duration-200',
          isPlaying
            ? 'cursor-wait'
            : 'cursor-pointer hover:scale-105 active:scale-95',
        )}
        style={{
          backgroundColor: isPlaying ? 'var(--primary-soft)' : 'var(--cta-bg)',
          color: isPlaying ? 'var(--primary)' : 'var(--cta-fg)',
          boxShadow: isPlaying ? 'none' : '0 4px 12px oklch(0.18 0.008 250 / 0.25)',
        }}
      >
        {isPlaying ? (
          <SoundWaveIcon />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M6.5 4.2a.75.75 0 0 0-1.25.56v10.5a.75.75 0 0 0 1.25.56l7.5-5.25a.75.75 0 0 0 0-1.12L6.5 4.2Z" />
          </svg>
        )}
      </button>
      <p
        className="text-[12px] font-medium tracking-wide"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {isPlaying ? 'Playing…' : 'Tap to listen'}
      </p>
    </div>
  )
}

function SoundWaveIcon() {
  return (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="currentColor" aria-hidden>
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

interface AnswerInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function AnswerInput({ inputRef, value, disabled, onChange, onKeyDown }: AnswerInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-[11px] font-semibold uppercase tracking-[.08em]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Type what you hear
      </label>
      <textarea
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        placeholder="Write the sentence…"
        className={cn(
          'w-full resize-none rounded-[var(--radius-md)] border-[1.5px] px-4 py-3 text-[15px] outline-none transition-all duration-150',
          disabled
            ? 'cursor-default'
            : 'focus:border-[var(--primary)]',
        )}
        style={{
          backgroundColor: 'var(--surface-sunken)',
          borderColor: disabled ? 'var(--border-subtle)' : 'var(--border-default)',
          color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
        }}
      />
      {!disabled && (
        <p className="text-right text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Enter to submit · Shift+Enter for newline
        </p>
      )}
    </div>
  )
}

function SubmitButton({ disabled, onSubmit }: { disabled: boolean; onSubmit: () => void }) {
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      className={cn(
        'w-full rounded-[var(--radius-md)] py-3 text-[14px] font-semibold transition-all duration-150',
        disabled
          ? 'cursor-not-allowed'
          : 'cursor-pointer hover:opacity-90 active:scale-[0.99]',
      )}
      style={
        disabled
          ? { backgroundColor: 'var(--surface-raised)', color: 'var(--text-disabled)' }
          : { backgroundColor: 'var(--cta-bg)', color: 'var(--cta-fg)' }
      }
    >
      Check answer
    </button>
  )
}

function FeedbackBar({ state, correctSentence }: { state: AnswerState; correctSentence: string }) {
  const isCorrect = state === 'correct'
  return (
    <div
      className="flex gap-3 rounded-[var(--radius-md)] px-4 py-3.5 text-[13px] border"
      style={{
        backgroundColor: isCorrect ? 'var(--success-soft)' : 'var(--error-soft)',
        borderColor: isCorrect ? 'var(--success-border)' : 'var(--error-border)',
      }}
    >
      <span
        className="mt-px flex-shrink-0 text-base leading-none"
        aria-hidden
      >
        {isCorrect ? '✓' : '✗'}
      </span>
      <div className="flex flex-col gap-0.5">
        <p
          className="font-semibold"
          style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}
        >
          {isCorrect ? 'Correct!' : 'Not quite'}
        </p>
        {!isCorrect && (
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium">Correct answer: </span>
            {correctSentence}
          </p>
        )}
      </div>
    </div>
  )
}

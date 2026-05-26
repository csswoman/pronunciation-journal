'use client'

// Planned structure:
// <SentenceDictationExercise>
//   <PlayButton />      — triggers Web Speech API / audio URL playback
//   <AnswerInput />     — text input for typed transcription
//   <SubmitButton />    — disabled until user types something
//   <FeedbackBar />     — correct/wrong after submission

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/cn'
import type { SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: SentenceDictationExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
}

export function SentenceDictationExercise({ exercise, onSubmit }: Props) {
  const [input, setInput] = useState('')
  const [state, setState] = useState<AnswerState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const startMs = useRef(Date.now())
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => setIsPlaying(false)
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(exercise.sentence)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [exercise.audioUrl, exercise.sentence, isPlaying])

  function handleSubmit() {
    if (state !== 'idle' || !input.trim()) return
    const isCorrect = normalize(input) === normalize(exercise.sentence)
    setState(isCorrect ? 'correct' : 'wrong')
    onSubmit(isCorrect, input.trim(), Date.now() - startMs.current)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const done = state !== 'idle'

  return (
    <div className="flex w-full flex-col gap-5">
      <PlayButton isPlaying={isPlaying} onPlay={handlePlay} />
      <AnswerInput
        value={input}
        disabled={done}
        onChange={setInput}
        onKeyDown={handleKeyDown}
      />
      {!done && (
        <SubmitButton disabled={!input.trim()} onSubmit={handleSubmit} />
      )}
      {done && (
        <FeedbackBar isCorrect={state === 'correct'} sentence={exercise.sentence} />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PlayButton({ isPlaying, onPlay }: { isPlaying: boolean; onPlay: () => void }) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlaying}
        aria-label="Play sentence"
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-full)] px-6 py-3 text-[15px] font-semibold transition-all duration-200',
          isPlaying
            ? 'bg-primary/20 text-primary cursor-wait'
            : 'bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-sm',
        )}
      >
        <span aria-hidden="true">{isPlaying ? '🔊' : '▶'}</span>
        {isPlaying ? 'Playing…' : 'Play sentence'}
      </button>
    </div>
  )
}

interface AnswerInputProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function AnswerInput({ value, disabled, onChange, onKeyDown }: AnswerInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium uppercase tracking-[.06em] text-fg-muted">
        Type what you hear
      </label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        placeholder="Write the sentence…"
        className={cn(
          'w-full resize-none rounded-[var(--radius-md)] border-[1.5px] bg-surface px-4 py-3 text-[15px] text-fg outline-none transition-colors',
          disabled
            ? 'border-border-subtle text-fg-muted cursor-default'
            : 'border-border-subtle placeholder:text-fg-muted focus:border-primary',
        )}
      />
      <p className="text-right text-[11px] text-fg-muted">Enter to submit · Shift+Enter for newline</p>
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
        'rounded-[var(--radius-md)] py-3 px-6 text-[14px] font-semibold transition-all duration-200',
        disabled
          ? 'bg-surface-raised text-fg-subtle cursor-not-allowed'
          : 'bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-sm',
      )}
    >
      Check answer
    </button>
  )
}

function FeedbackBar({ isCorrect, sentence }: { isCorrect: boolean; sentence: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] px-4 py-3 text-[14px]',
        isCorrect ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      {isCorrect ? (
        <span className="font-medium">Correct!</span>
      ) : (
        <span>
          <span className="font-medium">The sentence was: </span>
          <span className="italic">{sentence}</span>
        </span>
      )}
    </div>
  )
}

'use client'

// Planned structure:
// <SentenceDictationExercise>
//   <AudioButton />     — centered play button with sound wave animation
//   <WordCountDashes /> — dashes hinting at word count
//   <AnswerInput />     — textarea, no label
//   <HintPanel />       — hint text below input (revealed via header button)
//   <CheckButton />     — full-width pill, disabled until user types

import { useState, useRef, useEffect, useCallback } from 'react'
// useCallback still used for handlePlay
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: SentenceDictationExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
  onHint?: () => void
  hintCount?: number
}

type AnswerState = 'idle' | 'correct' | 'wrong'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
}

export function SentenceDictationExercise({ exercise, onResult, onHint, hintCount = 0 }: Props) {
  const [input, setInput] = useState('')
  const [state, setState] = useState<AnswerState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlayingSlow, setIsPlayingSlow] = useState(false)
  const startMs = useRef(Date.now())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const slowAudioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const hint = exercise.sentence
    .trim()
    .split(/\s+/)
    .map(w => w[0] + '_'.repeat(Math.max(1, w.length - 1)))
    .join('  ')

  useEffect(() => {
    setInput('')
    setState('idle')
    setIsPlaying(false)
    setIsPlayingSlow(false)
    startMs.current = Date.now()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (slowAudioRef.current) {
      slowAudioRef.current.pause()
      slowAudioRef.current = null
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

  const handlePlaySlow = useCallback(() => {
    if (isPlayingSlow) return

    if (exercise.audioUrl) {
      const audio = new Audio(exercise.audioUrl)
      audio.playbackRate = 0.6
      slowAudioRef.current = audio
      setIsPlayingSlow(true)
      audio.play()
      audio.onended = () => { setIsPlayingSlow(false); inputRef.current?.focus() }
      audio.onerror = () => setIsPlayingSlow(false)
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(exercise.sentence)
      utterance.lang = 'en-US'
      utterance.rate = 0.5
      utterance.onstart = () => setIsPlayingSlow(true)
      utterance.onend = () => { setIsPlayingSlow(false); inputRef.current?.focus() }
      utterance.onerror = () => setIsPlayingSlow(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [exercise.audioUrl, exercise.sentence, isPlayingSlow])

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
    <div className="flex w-full flex-col gap-5">
      <AudioButtons
        isPlaying={isPlaying}
        isPlayingSlow={isPlayingSlow}
        onPlay={handlePlay}
        onPlaySlow={handlePlaySlow}
      />
      <WordCountDashes count={exercise.sentence.trim().split(/\s+/).length} />
      <AnswerInput
        inputRef={inputRef}
        value={input}
        disabled={done}
        onChange={setInput}
        onKeyDown={handleKeyDown}
      />
      {hintCount > 0 && <HintPanel hint={hint} />}
      {done && <FeedbackBar state={state} userAnswer={input} correctSentence={exercise.sentence} />}
      {!done && <CheckButton disabled={!input.trim()} onSubmit={handleSubmit} />}
    </div>
  )
}

function AudioButtons({
  isPlaying,
  isPlayingSlow,
  onPlay,
  onPlaySlow,
}: {
  isPlaying: boolean
  isPlayingSlow: boolean
  onPlay: () => void
  onPlaySlow: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlaying}
        aria-label={isPlaying ? 'Reproduciendo…' : 'Escuchar oración'}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200',
          isPlaying
            ? 'cursor-wait border-border-default bg-surface-raised text-fg-subtle'
            : 'cursor-pointer border-border-default bg-surface-raised text-fg hover:border-border-strong hover:scale-105 active:scale-95',
        )}
      >
        {isPlaying ? <SoundWaveIcon /> : <SpeakerIcon />}
      </button>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onPlaySlow}
          disabled={isPlayingSlow}
          aria-label={isPlayingSlow ? 'Reproduciendo lento…' : 'Escuchar despacio'}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200',
            isPlayingSlow
              ? 'cursor-wait border-border-default bg-surface-raised text-fg-subtle'
              : 'cursor-pointer border-border-subtle bg-surface-base text-fg-muted hover:border-border-default hover:text-fg hover:scale-105 active:scale-95',
          )}
        >
          <TurtleIcon />
        </button>
        <span className="text-[10px] uppercase tracking-widest text-fg-subtle font-medium">Lento</span>
      </div>
    </div>
  )
}

function TurtleIcon() {
  return (
    <span className="text-[11px] font-bold leading-none" aria-hidden>0.5×</span>
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

function WordCountDashes({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-px bg-border-strong"
          style={{ width: '18px' }}
        />
      ))}
    </div>
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
    <textarea
      ref={inputRef}
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      rows={3}
      placeholder="Type what you hear…"
      className={cn(
        'w-full resize-none rounded-(--radius-lg) border px-4 py-3.5 text-[15px] text-fg outline-none transition-all duration-150 bg-surface-raised placeholder:text-fg-subtle',
        disabled
          ? 'cursor-default border-border-subtle text-fg-subtle'
          : 'border-border-default focus:border-primary',
      )}
    />
  )
}

function CheckButton({ disabled, onSubmit }: { disabled: boolean; onSubmit: () => void }) {
  return (
    <button
      type="button"
      onClick={onSubmit}
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

function HintPanel({ hint }: { hint: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md bg-surface-sunken px-4 py-3">
      <Lightbulb size={14} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden />
      <p className="text-[13px] text-fg-muted italic">{hint}</p>
    </div>
  )
}

function diffWords(userAnswer: string, correct: string) {
  const userWords = userAnswer.trim().split(/\s+/)
  const correctWords = correct.trim().split(/\s+/)
  return correctWords.map((word, i) => {
    const userWord = userWords[i] ?? ''
    const match = userWord.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, '')
    return { word, match, missing: !userWord }
  })
}

function FeedbackBar({ state, userAnswer, correctSentence }: {
  state: AnswerState
  userAnswer: string
  correctSentence: string
}) {
  const isCorrect = state === 'correct'
  const diff = isCorrect ? null : diffWords(userAnswer, correctSentence)

  return (
    <div className={cn(
      'flex flex-col gap-2 rounded-md border px-4 py-3.5',
      isCorrect ? 'bg-success-soft border-success-border' : 'bg-surface-raised border-border-default',
    )}>
      <p className={cn('text-[13px] font-semibold', isCorrect ? 'text-success' : 'text-fg')}>
        {isCorrect ? '¡Well done!' : 'Almost there — here\'s the correct sentence:'}
      </p>
      {diff && (
        <p className="text-[14px] leading-relaxed flex flex-wrap gap-x-1">
          {diff.map((token, i) => (
            <span
              key={i}
              className={cn(
                'font-medium',
                token.match ? 'text-success' : token.missing ? 'text-fg-subtle' : 'text-error',
              )}
            >
              {token.word}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

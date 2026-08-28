'use client'

// Planned structure:
// <SentenceDictationExercise>
//   <AudioButtons />    — Listen + Slow playback PillButtons
//   <WordCountBadge />  — Subtle word count indicator
//   <AnswerInput />     — Clean textarea with Enter trigger
//   <HintPanel />       — Structured word tokens with initial letters + target meaning
//   <FeedbackBar />     — Color-coded diff result bar
//   <CheckButton />     — Full-width primary submit button
// </SentenceDictationExercise>

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import {
  AnswerInput,
  AudioButtons,
  CheckButton,
  FeedbackBar,
  HintPanel,
  WordCountBadge,
  type DictationAnswerState,
} from './sentence-dictation/SentenceDictationControls'

interface Props {
  exercise: SentenceDictationExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
  hintCount?: number
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
}

export function SentenceDictationExercise({ exercise, onResult, hintCount = 0 }: Props) {
  const [input, setInput] = useState('')
  const [state, setState] = useState<DictationAnswerState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlayingSlow, setIsPlayingSlow] = useState(false)
  const startMs = useRef(Date.now())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const slowAudioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const { playCorrect, playWrong } = useUISounds()

  const words = useMemo(
    () => exercise.sentence.trim().split(/\s+/).filter(Boolean),
    [exercise.sentence],
  )

  useEffect(() => {
    setInput('')
    setState('idle')
    setIsPlaying(false)
    setIsPlayingSlow(false)
    startMs.current = Date.now()
    audioRef.current?.pause()
    audioRef.current = null
    slowAudioRef.current?.pause()
    slowAudioRef.current = null
    window.speechSynthesis?.cancel()
  }, [exercise.id])

  const play = useCallback(
    (slow = false) => {
      const setPlaying = slow ? setIsPlayingSlow : setIsPlaying
      const ref = slow ? slowAudioRef : audioRef
      if (slow ? isPlayingSlow : isPlaying) return
      if (exercise.audioUrl) {
        const audio = new Audio(exercise.audioUrl)
        audio.playbackRate = slow ? 0.6 : 1
        ref.current = audio
        setPlaying(true)
        audio.play()
        audio.onended = () => {
          setPlaying(false)
          inputRef.current?.focus()
        }
        audio.onerror = () => setPlaying(false)
        return
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(exercise.sentence)
        utterance.lang = 'en-US'
        utterance.rate = slow ? 0.5 : 0.9
        utterance.onstart = () => setPlaying(true)
        utterance.onend = () => {
          setPlaying(false)
          inputRef.current?.focus()
        }
        utterance.onerror = () => setPlaying(false)
        window.speechSynthesis.speak(utterance)
      }
    },
    [exercise.audioUrl, exercise.sentence, isPlaying, isPlayingSlow],
  )

  function handleSubmit() {
    if (state !== 'idle' || !input.trim()) return
    const isCorrect = normalize(input) === normalize(exercise.sentence)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect()
    else playWrong()
    const userAnswer = input.trim()
    onResult(isCorrect, userAnswer, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, userAnswer, {
        hintUsed: hintCount > 0,
      }),
    })
  }

  const done = state !== 'idle'

  return (
    <div className="flex w-full flex-col gap-4">
      <AudioButtons
        isPlaying={isPlaying}
        isPlayingSlow={isPlayingSlow}
        onPlay={() => play()}
        onPlaySlow={() => play(true)}
      />

      <WordCountBadge count={words.length} />

      <AnswerInput
        inputRef={inputRef}
        value={input}
        disabled={done}
        onChange={setInput}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSubmit()
          }
        }}
      />

      {hintCount > 0 && (
        <HintPanel words={words} targetMeaning={exercise.targetMeaning} />
      )}

      {done && (
        <FeedbackBar
          state={state}
          userAnswer={input}
          correctSentence={exercise.sentence}
        />
      )}

      {!done && (
        <CheckButton disabled={!input.trim()} onSubmit={handleSubmit} />
      )}
    </div>
  )
}

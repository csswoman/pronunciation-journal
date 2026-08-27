'use client'

// Planned structure:
// <ConjugationBlankExercise>
//   <SentencePrompt />
//   <AnswerInput />
//   <HintPanel />
//   <SubmitButton />
// </ConjugationBlankExercise>

import { useState, useRef, useEffect } from 'react'
import { Lightbulb } from '@/components/icons'
import Button from '@/components/ui/Button'
import { useUISounds } from '@/hooks/useUISounds'
import type { ConjugationBlankExercise as Exercise } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'

interface Props {
  exercise: Exercise
  onResult: (
    correct: boolean,
    answer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
  hintCount?: number
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/[’']/g, "'")

function getHintData(exercise: Exercise, hintCount: number) {
  if (hintCount <= 0) return null

  const hasAuthoredHint = Boolean(exercise.hint?.trim())
  const firstLetter = exercise.answer?.[0] ?? ''
  const letterCount = exercise.answer?.length ?? 0
  const letterClue = firstLetter ? `Empieza por "${firstLetter}…" (${letterCount} letras).` : ''

  if (hasAuthoredHint) {
    const maxLevel = 2
    const level = Math.min(hintCount, maxLevel)
    const hintText = level === 1 ? exercise.hint! : `${exercise.hint} ${letterClue}`.trim()
    return { hint: hintText, level, maxLevel }
  }

  return {
    hint: letterClue || (exercise.lemma ? `Forma del verbo "${exercise.lemma}".` : 'Revisa la conjugación del verbo.'),
    level: 1,
    maxLevel: 1,
  }
}

export function ConjugationBlankExercise({
  exercise,
  onResult,
  hintCount = 0,
}: Props) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const startMs = useRef(Date.now())
  const { playCorrect, playWrong } = useUISounds()

  useEffect(() => {
    setAnswer('')
    setDone(false)
    startMs.current = Date.now()
  }, [exercise.id])

  const submit = () => {
    if (!answer.trim() || done) return
    const accepted = [exercise.answer, ...(exercise.acceptedAnswers ?? [])].map(normalize)
    const correct = accepted.includes(normalize(answer))
    setDone(true)
    if (correct) playCorrect()
    else playWrong()
    onResult(correct, answer, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, correct, answer, {
        hintUsed: hintCount > 0,
      }),
    })
  }

  const hintData = getHintData(exercise, hintCount)

  return (
    <div className="flex flex-col gap-6 w-full">
      <SentencePrompt sentence={exercise.sentence} lemma={exercise.lemma} />

      <AnswerInput
        answer={answer}
        done={done}
        onChange={setAnswer}
        onSubmit={submit}
      />

      {hintData && (
        <HintPanel
          hint={hintData.hint}
          level={hintData.level}
          maxLevel={hintData.maxLevel}
        />
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={done || !answer.trim()}
        onClick={submit}
      >
        Comprobar
      </Button>
    </div>
  )
}

function SentencePrompt({ sentence, lemma }: { sentence: string; lemma?: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-sunken/50 p-5 sm:p-6 text-center">
      <p className="text-h3 font-medium leading-relaxed text-fg sm:text-h2">{sentence}</p>
      {lemma ? (
        <p className="mt-3 text-caption text-fg-muted">
          Verbo en infinitivo: <strong className="font-mono font-semibold text-primary">{lemma}</strong>
        </p>
      ) : null}
    </div>
  )
}

function AnswerInput({
  answer,
  done,
  onChange,
  onSubmit,
}: {
  answer: string
  done: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="conjugation-input" className="text-body-sm font-medium text-fg-muted">
        Forma verbal conjugada
      </label>
      <input
        id="conjugation-input"
        aria-label="Forma verbal"
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onSubmit()
          }
        }}
        disabled={done}
        placeholder="Escribe la forma verbal…"
        className="min-h-13 rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg text-fg focus-ring placeholder:text-fg-subtle"
      />
    </div>
  )
}

function HintPanel({
  hint,
  level,
  maxLevel,
}: {
  hint: string
  level?: number
  maxLevel?: number
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl bg-surface-sunken/80 border border-border-subtle p-4 text-left shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning border border-warning/20 mt-0.5">
        <Lightbulb size={18} aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        {level && maxLevel && maxLevel > 1 ? (
          <span className="font-mono text-tiny uppercase tracking-wider font-semibold text-fg-muted">
            Pista {level} de {maxLevel}
          </span>
        ) : null}
        <p className="text-body-sm text-fg leading-relaxed">{hint}</p>
      </div>
    </div>
  )
}

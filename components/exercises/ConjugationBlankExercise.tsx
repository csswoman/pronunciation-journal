'use client'

// Planned structure:
// <ConjugationBlankExercise>
//   <SentencePrompt />
//   <AnswerInput />
//   <HintPanel />
//   <SubmitButton />
// </ConjugationBlankExercise>

import { useState, useRef, useEffect, Fragment } from 'react'
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

  // Sin pista redactada, la letra sola no enseña nada: para un principiante lo
  // útil es qué forma se pide. El deletreo llega después, como último recurso.
  if (exercise.lemma) {
    const maxLevel = 2
    const level = Math.min(hintCount, maxLevel)
    return {
      hint: level === 1
        ? `Conjuga "${exercise.lemma}" para que encaje con el sujeto y el tiempo de la oración.`
        : `Conjuga "${exercise.lemma}". ${letterClue}`.trim(),
      level,
      maxLevel,
    }
  }

  return {
    hint: letterClue || 'Fíjate en el sujeto y en el tiempo verbal que pide la oración.',
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

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="rounded-full font-bold"
          disabled={done || !answer.trim()}
          onClick={submit}
        >
          <span>Comprobar</span>
          <span className="hidden rounded-md bg-ink/10 px-2 py-0.5 font-mono text-tiny font-bold sm:inline-flex" aria-hidden>
            Enter
          </span>
        </Button>
      </div>
    </div>
  )
}

function SentencePrompt({ sentence, lemma }: { sentence: string; lemma?: string }) {
  const parts = sentence.includes('___') ? sentence.split('___') : [sentence]
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-sky-deep/30 bg-sky p-8 text-center shadow-2xs sm:p-10">
      <p className="flex flex-wrap items-baseline justify-center gap-x-2.5 font-display text-2xl font-bold leading-relaxed text-ink sm:text-3xl">
        {parts.map((part, i) => (
          <Fragment key={i}>
            {part.trim() ? <span>{part.trim()}</span> : null}
            {i < parts.length - 1 ? (
              <span
                aria-hidden
                className="inline-block h-7 w-28 border-b-2 border-dashed border-ink/40 sm:w-32"
              />
            ) : null}
          </Fragment>
        ))}
      </p>
      {lemma ? (
        <p className="rounded-full bg-paper/60 px-4 py-1.5 text-body-sm font-medium text-ink-muted">
          Verbo en infinitivo: <strong className="ml-1 font-display font-bold text-ink">{lemma}</strong>
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
      <label htmlFor="conjugation-input" className="text-body-sm font-semibold text-fg">
        Forma conjugada
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
        placeholder="Escribe la forma correcta…"
        className="min-h-14 rounded-2xl border-2 border-border-strong bg-surface-sunken px-5 py-3.5 text-body-lg text-fg focus:border-primary focus-ring placeholder:text-fg-muted disabled:opacity-60 disabled:cursor-not-allowed"
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

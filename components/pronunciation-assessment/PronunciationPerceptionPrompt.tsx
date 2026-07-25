'use client'

import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { PerceptionAnswer } from '@/lib/pronunciation/assessment/scoring'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'
import { speak } from '@/lib/phoneme-practice/tts'
import {
  WORD_STRESS_PERCEPTION_ITEMS,
  wordStressScore,
  type WordStressPerceptionItem,
} from '@/lib/pronunciation/assessment/word-stress-perception'

interface PronunciationPerceptionPromptProps {
  selection: DiagnosticPromptSelection
  onAnswer: (answer: PerceptionAnswer | null) => void
  /** Word-stress items to present this run. Defaults to the full bank for non-sampled callers. */
  wordStressItems?: readonly WordStressPerceptionItem[]
}

export function PronunciationPerceptionPrompt({
  selection,
  onAnswer,
  wordStressItems = WORD_STRESS_PERCEPTION_ITEMS,
}: PronunciationPerceptionPromptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { title, ipaHint, plainHint } = getLearnerTargetCopy(selection.targetId)
  const isWordStressTest = selection.targetId === 'prosody.word-stress'
  const [wordStressIndex, setWordStressIndex] = useState(0)
  const [correctWordStressAnswers, setCorrectWordStressAnswers] = useState(0)
  const [hasListened, setHasListened] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null)

  const wordStressItem = wordStressItems[wordStressIndex]

  useEffect(() => {
    headingRef.current?.focus()
  }, [selection.targetId])

  useEffect(() => {
    if (!isWordStressTest) return
    setTtsAvailable(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [isWordStressTest])

  function playWordStressItem() {
    if (!wordStressItem) return
    speak(wordStressItem.word)
    setHasListened(true)
  }

  function answerWordStress(syllableIndex: number) {
    if (!wordStressItem) return
    const nextCorrectAnswers = correctWordStressAnswers + Number(syllableIndex === wordStressItem.stressedSyllableIndex)
    const isLastItem = wordStressIndex + 1 === wordStressItems.length

    if (isLastItem) {
      onAnswer({
        correct: nextCorrectAnswers === wordStressItems.length,
        score: wordStressScore(nextCorrectAnswers, wordStressItems.length),
        perceptionItemCount: wordStressItems.length,
      })
      return
    }

    setCorrectWordStressAnswers(nextCorrectAnswers)
    setWordStressIndex((index) => index + 1)
    setHasListened(false)
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="sr-only">
        {isWordStressTest ? 'Prueba de percepción de la sílaba tónica' : 'Autoinforme sobre este contraste'}
      </legend>
      <div className="flex min-w-0 flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 text-pretty break-words text-h4 text-fg outline-none"
        >
          {isWordStressTest ? `Escucha la palabra. ¿Qué sílaba lleva el énfasis?` : `¿Qué tan cómodo te sientes con: ${title}?`}
          {ipaHint ? (
            <>
              {' '}
              <span className="font-ipa font-normal text-fg-muted" aria-label={title}>
                ({ipaHint})
              </span>
            </>
          ) : null}
        </h2>
        {plainHint && !isWordStressTest ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg">{plainHint}</p>
        ) : null}
        {isWordStressTest ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted" aria-live="polite">
            Palabra {wordStressIndex + 1} de {wordStressItems.length}. Escúchala antes de responder; esto evalúa lo que distingues al oírla, no cómo la pronuncias.
          </p>
        ) : (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
            Aún no hay audio de ejemplo. Responde según tu experiencia — no es un examen.
          </p>
        )}
      </div>
      {isWordStressTest ? (
        ttsAvailable === false ? (
          <div className="flex max-w-prose flex-col gap-3 rounded-md bg-surface-sunken p-4">
            <p className="font-body-sm text-fg">No podemos reproducir el audio en este navegador, así que no contaremos esta prueba.</p>
            <Button type="button" variant="outline" className="min-h-11 self-start" onClick={() => onAnswer(null)}>
              Continuar sin medir
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 self-center"
              onClick={playWordStressItem}
            >
              Escuchar palabra
            </Button>
            <div
              key={wordStressItem?.word}
              className="grid w-full grid-cols-3 gap-2"
              aria-label="Elige la sílaba con énfasis"
            >
              {wordStressItem?.syllables.map((syllable, index) => (
                <Button
                  key={`${syllable}-${index}`}
                  type="button"
                  variant="outline"
                  fullWidth
                  className="min-h-11"
                  disabled={!hasListened}
                  onClick={() => answerWordStress(index)}
                >
                  {syllable}
                </Button>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="min-h-11"
            onClick={() => onAnswer({ correct: true })}
          >
            Me desenvuelvo bien
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="min-h-11"
            onClick={() => onAnswer({ correct: false })}
          >
            Me cuesta
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 text-fg-subtle"
        onClick={() => onAnswer(null)}
      >
        Saltar
      </Button>
    </fieldset>
  )
}

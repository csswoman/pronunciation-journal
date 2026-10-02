'use client'

// Planned structure:
// <MatchPairsExercise>
//   <MatchPairsBoard />
//   <MatchPairsFooter>  (contador de pares + Comprobar/Enter)
// </MatchPairsExercise>

import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { shuffle } from '@/lib/exercises/utils'
import { speak } from '@/lib/phoneme-practice/tts'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import { MatchPairsBoard, type MatchResult } from './MatchPairsBoard'

interface Props {
  exercise: MatchPairsExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
}

export function MatchPairsExercise({ exercise, onResult }: Props) {
  // Only reshuffle when the exercise identity changes — `exercise.pairs` gets a
  // new array reference on every parent re-render, which previously caused the
  // right column to reshuffle mid-exercise and desync already-drawn connection lines.
  const rightItems = useMemo(
    () => shuffle(exercise.pairs.map((p) => ({ id: p.id, label: p.right }))),
    [exercise.id],
  )

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [armedRight, setArmedRight] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [results, setResults] = useState<MatchResult>({})
  const [submitted, setSubmitted] = useState(false)

  const leftRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  const matchedRightIds = new Set(Object.values(matches))
  const unmatch = (leftId: string) =>
    setMatches((prev) => {
      const next = { ...prev }
      delete next[leftId]
      return next
    })

  const expectedRightText = (leftId: string) =>
    exercise.pairs.find((p) => p.id === leftId)?.right
  const rightText = (rightId: string) =>
    exercise.pairs.find((p) => p.id === rightId)?.right
  const isPairCorrect = (leftId: string) => {
    const chosen = matches[leftId]
    return chosen != null && rightText(chosen) === expectedRightText(leftId)
  }

  function completeMatch(leftId: string, rightId: string) {
    playTap()
    setMatches((prev) => ({ ...prev, [leftId]: rightId }))
    setArmedRight(null)
    setSelectedLeft(null)
  }

  function handleLeftClick(pair: { id: string; left: string }) {
    if (submitted || results[pair.id]) return
    speak(pair.left)
    if (matches[pair.id]) {
      unmatch(pair.id)
      setSelectedLeft(null)
      setArmedRight(null)
      return
    }
    if (armedRight) {
      completeMatch(pair.id, armedRight)
      return
    }
    setSelectedLeft((prev) => (prev === pair.id ? null : pair.id))
  }

  function handleRightClick(rightId: string) {
    if (submitted) return
    const leftIdOfThisRight = Object.keys(matches).find((l) => matches[l] === rightId)
    if (leftIdOfThisRight && !selectedLeft) {
      unmatch(leftIdOfThisRight)
      return
    }
    if (selectedLeft) {
      if (matchedRightIds.has(rightId) && matches[selectedLeft] !== rightId) return
      completeMatch(selectedLeft, rightId)
      return
    }
    setArmedRight((prev) => (prev === rightId ? null : rightId))
  }

  function handleCheck() {
    if (submitted) return
    const newResults: MatchResult = {}
    let allCorrect = true
    let correctPairCount = 0
    for (const pair of exercise.pairs) {
      const correct = isPairCorrect(pair.id)
      newResults[pair.id] = correct ? 'correct' : 'wrong'
      if (correct) correctPairCount += 1
      if (!correct) allCorrect = false
    }
    setResults(newResults)
    setSubmitted(true)
    if (allCorrect) playCorrect()
    else playWrong()
    const userAnswer = JSON.stringify(matches)
    onResult(allCorrect, userAnswer, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, allCorrect, userAnswer, {
        correctPairCount,
        totalPairCount: exercise.pairs.length,
      }),
    })
  }

  useEffect(() => {
    startMs.current = Date.now()
    setSelectedLeft(null)
    setArmedRight(null)
    setMatches({})
    setResults({})
    setSubmitted(false)
  }, [exercise.id])

  const allMatched = exercise.pairs.every((p) => matches[p.id])
  const matchedCount = Object.keys(matches).length

  useEffect(() => {
    if (!allMatched || submitted) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') handleCheck()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allMatched, submitted, matches])

  return (
    <div className="flex w-full flex-col gap-6">
      <MatchPairsBoard
        pairs={exercise.pairs}
        rightItems={rightItems}
        leftElements={leftRefs.current}
        rightElements={rightRefs.current}
        selectedLeft={selectedLeft}
        armedRight={armedRight}
        matches={matches}
        results={results}
        submitted={submitted}
        onLeftClick={handleLeftClick}
        onRightClick={handleRightClick}
      />

      {!submitted && (
        <div className="flex items-center justify-end gap-4">
          <span className="text-body-sm tabular-nums text-fg-muted" aria-live="polite">
            {matchedCount} de {exercise.pairs.length} pares
          </span>
          <Button
            variant="primary"
            size="lg"
            className="rounded-full font-bold"
            onClick={handleCheck}
            disabled={!allMatched}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            <span>Comprobar</span>
            <span
              className="hidden rounded-md bg-ink/10 px-2 py-0.5 font-mono text-tiny font-bold sm:inline-flex"
              aria-hidden
            >
              Enter
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}

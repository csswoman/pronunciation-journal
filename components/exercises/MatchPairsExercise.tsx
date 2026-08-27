'use client'

// Planned structure:
// <MatchPairsExercise>
//   <MatchPairsBoard />
//   <CheckButton />
// </MatchPairsExercise>

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { shuffle } from '@/lib/exercises/utils'
import { speak } from '@/lib/phoneme-practice/tts'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import {
  MatchPairsBoard,
  type MatchConnection,
  type MatchResult,
} from './MatchPairsBoard'
import { MATCH_DOT_COLORS } from './match-pairs-board-helpers'

interface Props {
  exercise: MatchPairsExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function MatchPairsExercise({ exercise, onResult }: Props) {
  const rightItems = useMemo(
    () => shuffle(exercise.pairs.map((p) => ({ id: p.id, label: p.right }))),
    [exercise.id, exercise.pairs],
  )

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [armedRight, setArmedRight] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [results, setResults] = useState<MatchResult>({})
  const [submitted, setSubmitted] = useState(false)
  const [connections, setConnections] = useState<MatchConnection[]>([])

  const boardRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  const matchedRightIds = new Set(Object.values(matches))
  const pairColor = (leftId: string) =>
    MATCH_DOT_COLORS[exercise.pairs.findIndex((p) => p.id === leftId) % MATCH_DOT_COLORS.length]

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

  const recomputeConnections = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    const next: MatchConnection[] = []
    for (const [leftId, rightId] of Object.entries(matches)) {
      const leftEl = leftRefs.current.get(leftId)
      const rightEl = rightRefs.current.get(rightId)
      if (!leftEl || !rightEl) continue
      const lr = leftEl.getBoundingClientRect()
      const rr = rightEl.getBoundingClientRect()
      next.push({
        leftId,
        rightId,
        from: { x: lr.right - boardRect.left, y: lr.top + lr.height / 2 - boardRect.top },
        to: { x: rr.left - boardRect.left, y: rr.top + rr.height / 2 - boardRect.top },
        state: results[leftId] ?? 'pending',
      })
    }
    setConnections(next)
  }, [matches, results])

  useIsoLayoutEffect(() => {
    recomputeConnections()
  }, [recomputeConnections, rightItems])

  useEffect(() => {
    startMs.current = Date.now()
    setSelectedLeft(null)
    setArmedRight(null)
    setMatches({})
    setResults({})
    setSubmitted(false)
    setConnections([])
  }, [exercise.id])

  useEffect(() => {
    const board = boardRef.current
    if (!board || typeof window === 'undefined') return
    const ro = new ResizeObserver(() => recomputeConnections())
    ro.observe(board)
    window.addEventListener('resize', recomputeConnections)
    window.addEventListener('scroll', recomputeConnections, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recomputeConnections)
      window.removeEventListener('scroll', recomputeConnections, true)
    }
  }, [recomputeConnections])

  const allMatched = exercise.pairs.every((p) => matches[p.id])
  return (
    <div className="flex w-full flex-col gap-6">
      <MatchPairsBoard
        pairs={exercise.pairs}
        rightItems={rightItems}
        leftElements={leftRefs.current}
        rightElements={rightRefs.current}
        boardRef={boardRef}
        selectedLeft={selectedLeft}
        armedRight={armedRight}
        matches={matches}
        results={results}
        submitted={submitted}
        connections={connections}
        pairColor={pairColor}
        onLeftClick={handleLeftClick}
        onRightClick={handleRightClick}
      />

      {!submitted && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCheck}
          disabled={!allMatched}
          data-cuelume-press="press"
          data-cuelume-release="release"
        >
          Comprobar
        </Button>
      )}
    </div>
  )
}

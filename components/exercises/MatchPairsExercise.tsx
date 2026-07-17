'use client'

// Planned structure:
// <MatchPairsExercise>
//   <MatchPairsHint />
//   <MatchPairsProgress />
//   <PairsBoard>
//     <LeftColumn />   — term cards with color dot
//     <SVG lines />    — connector curves
//     <RightColumn />  — definition cards with matching dot
//   </PairsBoard>
//   <CheckButton />
// </MatchPairsExercise>

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { shuffle } from '@/lib/exercises/utils'
import { speak } from '@/lib/phoneme-practice/tts'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'

interface Props {
  exercise: MatchPairsExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
}

type MatchResult = Record<string, 'correct' | 'wrong' | null>
type Endpoint = { x: number; y: number }
type Connection = {
  leftId: string
  rightId: string
  from: Endpoint
  to: Endpoint
  state: 'pending' | 'correct' | 'wrong'
}

const DOT_COLORS = [
  'oklch(0.65 0.18 25)',
  'oklch(0.65 0.18 250)',
  'oklch(0.65 0.18 310)',
  'oklch(0.65 0.16 145)',
  'oklch(0.70 0.18 55)',
  'oklch(0.65 0.16 185)',
]

const CARD_BASE =
  'relative z-10 flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all duration-200'

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
  const [connections, setConnections] = useState<Connection[]>([])

  const boardRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  const matchedRightIds = new Set(Object.values(matches))
  const matchedCount = Object.keys(matches).length
  const totalCount = exercise.pairs.length
  const pairColor = (leftId: string) =>
    DOT_COLORS[exercise.pairs.findIndex((p) => p.id === leftId) % DOT_COLORS.length]

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
    const next: Connection[] = []
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
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
      {!submitted && (
        <p className="m-0 w-full text-center text-sm text-fg-muted">
          Toca un término y luego su definición — o al revés.
        </p>
      )}

      {!submitted && matchedCount > 0 && (
        <p
          className="m-0 animate-state-in text-center text-xs font-medium tabular-nums text-fg-subtle"
          aria-live="polite"
        >
          {matchedCount} de {totalCount} emparejados
        </p>
      )}

      <div
        ref={boardRef}
        className="relative grid w-full grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-x-4 gap-y-2 sm:gap-x-6"
      >
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          {connections.map((c) => {
            const midX = (c.from.x + c.to.x) / 2
            const d = `M ${c.from.x},${c.from.y} C ${midX},${c.from.y} ${midX},${c.to.y} ${c.to.x},${c.to.y}`
            const stroke = strokeFor(c.state, c.leftId, pairColor)
            return (
              <g key={`${c.leftId}-${c.rightId}`} className="animate-state-in">
                <path
                  d={d}
                  stroke={stroke}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  opacity={c.state === 'pending' ? 0.75 : 1}
                />
                <circle cx={c.from.x} cy={c.from.y} r={3.5} fill={stroke} />
                <circle cx={c.to.x} cy={c.to.y} r={3.5} fill={stroke} />
              </g>
            )
          })}
        </svg>

        <div role="list" aria-label="Términos" className="flex flex-col gap-2">
          {exercise.pairs.map((pair) => (
            <button
              key={pair.id}
              ref={(el) => {
                if (el) leftRefs.current.set(pair.id, el)
                else leftRefs.current.delete(pair.id)
              }}
              type="button"
              role="listitem"
              aria-pressed={selectedLeft === pair.id || !!matches[pair.id]}
              aria-disabled={submitted || !!results[pair.id]}
              onClick={() => handleLeftClick(pair)}
              disabled={submitted || !!results[pair.id]}
              className={leftCardClass({
                pairId: pair.id,
                selectedLeft,
                matches,
                results,
                submitted,
              })}
            >
              <ColorDot
                color={dotColorForLeft(pair.id, matches, results, submitted, pairColor)}
              />
              <span className="text-sm font-semibold">{pair.left}</span>
            </button>
          ))}
        </div>

        <div role="list" aria-label="Definiciones" className="flex flex-col gap-2">
          {rightItems.map((item) => {
            const matchedLeftId = Object.keys(matches).find((l) => matches[l] === item.id)
            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) rightRefs.current.set(item.id, el)
                  else rightRefs.current.delete(item.id)
                }}
                type="button"
                role="listitem"
                aria-pressed={armedRight === item.id || !!matchedLeftId}
                aria-disabled={submitted}
                onClick={() => handleRightClick(item.id)}
                disabled={submitted}
                className={rightCardClass({
                  rightId: item.id,
                  armedRight,
                  matches,
                  results,
                  submitted,
                })}
              >
                {matchedLeftId ? (
                  <ColorDot
                    color={dotColorForLeft(
                      matchedLeftId,
                      matches,
                      results,
                      submitted,
                      pairColor,
                    )}
                  />
                ) : (
                  <span
                    className="size-2.5 shrink-0 rounded-full bg-border-default"
                    aria-hidden
                  />
                )}
                <span className="text-[13px] leading-snug text-fg-secondary">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allMatched}
          data-cuelume-press="press"
          data-cuelume-release="release"
          className={cn(
            'w-full max-w-xl rounded-full py-3.5 text-[15px] font-semibold transition-all duration-150',
            allMatched
              ? 'cursor-pointer bg-(--cta-bg) text-(--cta-fg) hover:opacity-90 active:scale-[0.99]'
              : 'cursor-not-allowed bg-surface-raised text-fg-subtle opacity-50',
          )}
        >
          Comprobar
        </button>
      )}
    </div>
  )
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

function dotColorForLeft(
  leftId: string,
  matches: Record<string, string>,
  results: MatchResult,
  submitted: boolean,
  pairColor: (id: string) => string,
): string {
  if (submitted) {
    if (results[leftId] === 'correct') return 'var(--success)'
    if (results[leftId] === 'wrong') return 'var(--error)'
    return 'var(--border-default)'
  }
  if (matches[leftId]) return pairColor(leftId)
  return 'var(--border-default)'
}

function leftCardClass({
  pairId,
  selectedLeft,
  matches,
  results,
  submitted,
}: {
  pairId: string
  selectedLeft: string | null
  matches: Record<string, string>
  results: MatchResult
  submitted: boolean
}): string {
  const result = results[pairId]
  const isSelected = selectedLeft === pairId
  const isMatched = !!matches[pairId]

  return cn(
    CARD_BASE,
    result === 'correct' &&
      'cursor-default border-success-border bg-success-soft text-success pf-reveal-ok',
    result === 'wrong' &&
      'cursor-default border-error-border bg-error-soft text-error pf-reveal-bad',
    !result &&
      isSelected &&
      'border-primary bg-primary-soft text-primary shadow-sm',
    !result &&
      isMatched &&
      'border-primary/40 bg-surface-raised text-fg',
    !result &&
      !isSelected &&
      !isMatched &&
      'border-border-default bg-surface-raised text-fg hover:border-primary',
  )
}

function rightCardClass({
  rightId,
  armedRight,
  matches,
  results,
  submitted,
}: {
  rightId: string
  armedRight: string | null
  matches: Record<string, string>
  results: MatchResult
  submitted: boolean
}): string {
  const leftId = Object.keys(matches).find((l) => matches[l] === rightId)
  const result = leftId ? results[leftId] : undefined
  const isArmed = armedRight === rightId

  return cn(
    CARD_BASE,
    result === 'correct' &&
      'cursor-default border-success-border bg-success-soft pf-reveal-ok',
    result === 'wrong' &&
      'cursor-default border-error-border bg-error-soft pf-reveal-bad',
    !result && isArmed && 'border-primary bg-primary-soft text-fg shadow-sm',
    !result &&
      leftId &&
      'border-border-default bg-surface-raised',
    !result &&
      !leftId &&
      'border-border-default bg-surface-raised hover:border-primary',
  )
}

function strokeFor(
  state: Connection['state'],
  leftId: string,
  pairColor: (id: string) => string,
): string {
  if (state === 'correct') return 'var(--success)'
  if (state === 'wrong') return 'var(--error)'
  return pairColor(leftId)
}

'use client'

// Planned structure:
// <MatchPairsExercise>
//   <PairsBoard>
//     <LeftColumn />
//     <ConnectorLines (SVG paths over the gap) />
//     <RightColumn — shuffled />
//   </PairsBoard>
//   <CheckButton />

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '@/lib/exercises/utils'
import { speak } from '@/lib/phoneme-practice/tts'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: MatchPairsExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
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

const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export function MatchPairsExercise({ exercise, onSubmit }: Props) {
  const rightItems = useMemo(
    () => shuffle(exercise.pairs.map((p) => ({ id: p.id, label: p.right }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
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

  const matchedRightIds = new Set(Object.values(matches))

  function unmatch(leftId: string) {
    setMatches((prev) => {
      if (!(leftId in prev)) return prev
      const next = { ...prev }
      delete next[leftId]
      return next
    })
  }

  function handleLeftClick(pair: { id: string; left: string }) {
    if (submitted || results[pair.id]) return
    // Play pronunciation on every click.
    speak(pair.left)
    // If already matched, clicking unmatches.
    if (matches[pair.id]) {
      unmatch(pair.id)
      setSelectedLeft(null)
      setArmedRight(null)
      return
    }
    // If a right side is armed (right-first flow) → commit the match.
    if (armedRight) {
      setMatches((prev) => ({ ...prev, [pair.id]: armedRight }))
      setArmedRight(null)
      setSelectedLeft(null)
      return
    }
    setSelectedLeft((prev) => (prev === pair.id ? null : pair.id))
  }

  function handleRightClick(rightId: string) {
    if (submitted) return
    // If this right is already matched and user clicks it again → unmatch.
    const leftIdOfThisRight = Object.keys(matches).find(
      (l) => matches[l] === rightId,
    )
    if (leftIdOfThisRight && !selectedLeft) {
      unmatch(leftIdOfThisRight)
      return
    }
    // If a left is armed → commit the match.
    if (selectedLeft) {
      // If right is taken by a different left, ignore.
      if (matchedRightIds.has(rightId) && matches[selectedLeft] !== rightId) return
      setMatches((prev) => ({ ...prev, [selectedLeft]: rightId }))
      setSelectedLeft(null)
      return
    }
    // Right-first selection: arm this right side. Convert "right armed" by
    // temporarily storing it as a pseudo-selectedLeft? Cleaner: track armed
    // right separately.
    setArmedRight((prev) => (prev === rightId ? null : rightId))
  }

  function handleCheck() {
    if (submitted) return
    const newResults: MatchResult = {}
    let allCorrect = true
    for (const pair of exercise.pairs) {
      const matched = matches[pair.id]
      const correct = matched === pair.id
      newResults[pair.id] = correct ? 'correct' : 'wrong'
      if (!correct) allCorrect = false
    }
    setResults(newResults)
    setSubmitted(true)
    onSubmit(allCorrect, JSON.stringify(matches))
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
      const state: Connection['state'] = results[leftId] ?? 'pending'
      next.push({
        leftId,
        rightId,
        from: {
          x: lr.right - boardRect.left,
          y: lr.top + lr.height / 2 - boardRect.top,
        },
        to: {
          x: rr.left - boardRect.left,
          y: rr.top + rr.height / 2 - boardRect.top,
        },
        state,
      })
    }
    setConnections(next)
  }, [matches, results])

  // Recompute whenever matches/results/items change.
  useIsoLayoutEffect(() => {
    recomputeConnections()
  }, [recomputeConnections, rightItems])

  // Keep endpoints in sync with viewport resize, board resize (rotation,
  // sidebar toggle, font scale), and scroll-driven repositioning.
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

  function leftClass(pairId: string): string {
    const result = results[pairId]
    const isSelected = selectedLeft === pairId
    const isMatched = !!matches[pairId]
    const base =
      'relative z-10 rounded-[var(--radius-md)] py-3 px-3 text-[14px] font-semibold border-[1.5px] transition-all duration-200 text-left min-h-[48px] cursor-pointer'
    if (result === 'correct')
      return `${base} bg-success-soft border-success-border text-success cursor-default`
    if (result === 'wrong')
      return `${base} bg-error-soft border-error-border text-error cursor-default`
    if (isSelected)
      return `${base} bg-primary-soft border-primary text-primary shadow-md`
    if (isMatched)
      return `${base} bg-surface-raised border-primary/40 text-fg`
    return `${base} bg-surface-raised border-border-subtle text-fg hover:border-primary`
  }

  function rightClass(rightId: string): string {
    const leftId = Object.keys(matches).find((l) => matches[l] === rightId)
    const result = leftId ? results[leftId] : undefined
    const isMatched = !!leftId
    const isArmed = armedRight === rightId
    const base =
      'relative z-10 rounded-[var(--radius-md)] py-3 px-3 text-[13px] border-[1.5px] transition-all duration-200 text-left min-h-[48px] cursor-pointer'
    if (result === 'correct')
      return `${base} bg-success-soft border-success-border text-success cursor-default`
    if (result === 'wrong')
      return `${base} bg-error-soft border-error-border text-error cursor-default`
    if (isArmed)
      return `${base} bg-primary-soft border-primary text-primary shadow-md`
    if (isMatched)
      return `${base} bg-surface-raised border-primary/40 text-fg`
    if (selectedLeft !== null)
      return `${base} bg-surface-raised border-border-subtle text-fg hover:border-primary hover:bg-primary-soft`
    return `${base} bg-surface-raised border-border-subtle text-fg`
  }

  function strokeFor(state: Connection['state']): string {
    if (state === 'correct') return 'var(--success)'
    if (state === 'wrong') return 'var(--error)'
    return 'var(--primary)'
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <p className="m-0 text-center text-[15px] text-fg-muted">
        Match each word with its definition
      </p>

      <div ref={boardRef} className="relative grid grid-cols-2 gap-x-12 gap-y-2">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {connections.map((c) => {
            const midX = (c.from.x + c.to.x) / 2
            const d = `M ${c.from.x},${c.from.y} C ${midX},${c.from.y} ${midX},${c.to.y} ${c.to.x},${c.to.y}`
            const stroke = strokeFor(c.state)
            return (
              <g key={`${c.leftId}-${c.rightId}`}>
                <path
                  d={d}
                  stroke={stroke}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  opacity={c.state === 'pending' ? 0.8 : 1}
                />
                <circle cx={c.from.x} cy={c.from.y} r={3.5} fill={stroke} />
                <circle cx={c.to.x} cy={c.to.y} r={3.5} fill={stroke} />
              </g>
            )
          })}
        </svg>

        <div role="list" aria-label="Words" className="flex flex-col gap-2">
          {exercise.pairs.map((pair) => {
            const matchedRightId = matches[pair.id]
            const matchedRightLabel = matchedRightId
              ? rightItems.find((r) => r.id === matchedRightId)?.label
              : null
            const ariaLabel = matchedRightLabel
              ? `${pair.left}, matched with ${matchedRightLabel}. Click to unmatch.`
              : `${pair.left}. Click to select.`
            return (
              <button
                key={pair.id}
                ref={(el) => {
                  if (el) leftRefs.current.set(pair.id, el)
                  else leftRefs.current.delete(pair.id)
                }}
                type="button"
                role="listitem"
                aria-label={ariaLabel}
                aria-pressed={selectedLeft === pair.id || !!matches[pair.id]}
                aria-disabled={submitted || !!results[pair.id]}
                onClick={() => handleLeftClick(pair)}
                disabled={submitted || !!results[pair.id]}
                className={leftClass(pair.id)}
              >
                {pair.left}
              </button>
            )
          })}
        </div>

        <div role="list" aria-label="Definitions" className="flex flex-col gap-2">
          {rightItems.map((item) => {
            const matchedLeftId = Object.keys(matches).find((l) => matches[l] === item.id)
            const ariaLabel = matchedLeftId
              ? `${item.label}, matched. Click to unmatch.`
              : `${item.label}. Click to select.`
            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) rightRefs.current.set(item.id, el)
                  else rightRefs.current.delete(item.id)
                }}
                type="button"
                role="listitem"
                aria-label={ariaLabel}
                aria-pressed={armedRight === item.id || !!matchedLeftId}
                aria-disabled={submitted}
                onClick={() => handleRightClick(item.id)}
                disabled={submitted}
                className={rightClass(item.id)}
              >
                {item.label}
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
          aria-disabled={!allMatched}
          style={allMatched ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
          className={[
            'w-full rounded-[var(--radius-md)] border-0 py-4 text-[15px] font-semibold transition-all',
            allMatched
              ? 'cursor-pointer text-on-primary shadow-md hover:-translate-y-[1px]'
              : 'cursor-not-allowed bg-surface-raised text-fg-subtle',
          ].join(' ')}
        >
          Check
        </button>
      )}
    </div>
  )
}

'use client'

// Planned structure:
// <MatchPairsExercise>
//   <PromptLine />
//   <PairsBoard>
//     <LeftColumn />   — word cards with colored dot
//     <SVG lines />    — connector curves
//     <RightColumn />  — definition cards with left accent border
//   </PairsBoard>
//   <CheckButton />    — full-width rounded-full

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '@/lib/exercises/utils'
import { speak } from '@/lib/phoneme-practice/tts'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: MatchPairsExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}

type MatchResult = Record<string, 'correct' | 'wrong' | null>
type Endpoint   = { x: number; y: number }
type Connection = { leftId: string; rightId: string; from: Endpoint; to: Endpoint; state: 'pending' | 'correct' | 'wrong' }

// Palette for unsubmitted connection dots/lines — cycles through distinct hues
const DOT_COLORS = [
  'oklch(0.65 0.18 25)',   // red-orange
  'oklch(0.65 0.18 250)',  // blue
  'oklch(0.65 0.18 310)',  // purple
  'oklch(0.65 0.16 145)',  // green
  'oklch(0.70 0.18 55)',   // amber
  'oklch(0.65 0.16 185)',  // teal
]

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function MatchPairsExercise({ exercise, onResult }: Props) {
  const rightItems = useMemo(
    () => shuffle(exercise.pairs.map((p) => ({ id: p.id, label: p.right }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  )

  const [selectedLeft, setSelectedLeft]   = useState<string | null>(null)
  const [armedRight, setArmedRight]       = useState<string | null>(null)
  const [matches, setMatches]             = useState<Record<string, string>>({})
  const [results, setResults]             = useState<MatchResult>({})
  const [submitted, setSubmitted]         = useState(false)
  const [connections, setConnections]     = useState<Connection[]>([])

  const boardRef  = useRef<HTMLDivElement>(null)
  const leftRefs  = useRef<Map<string, HTMLButtonElement>>(new Map())
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const startMs   = useRef(Date.now())

  const matchedRightIds = new Set(Object.values(matches))
  const pairColor = (leftId: string) => DOT_COLORS[exercise.pairs.findIndex((p) => p.id === leftId) % DOT_COLORS.length]
  const unmatch   = (leftId: string) => setMatches((prev) => { const next = { ...prev }; delete next[leftId]; return next })

  function handleLeftClick(pair: { id: string; left: string }) {
    if (submitted || results[pair.id]) return
    speak(pair.left)
    if (matches[pair.id]) { unmatch(pair.id); setSelectedLeft(null); setArmedRight(null); return }
    if (armedRight) { setMatches((prev) => ({ ...prev, [pair.id]: armedRight })); setArmedRight(null); setSelectedLeft(null); return }
    setSelectedLeft((prev) => (prev === pair.id ? null : pair.id))
  }

  function handleRightClick(rightId: string) {
    if (submitted) return
    const leftIdOfThisRight = Object.keys(matches).find((l) => matches[l] === rightId)
    if (leftIdOfThisRight && !selectedLeft) { unmatch(leftIdOfThisRight); return }
    if (selectedLeft) {
      if (matchedRightIds.has(rightId) && matches[selectedLeft] !== rightId) return
      setMatches((prev) => ({ ...prev, [selectedLeft]: rightId }))
      setSelectedLeft(null)
      return
    }
    setArmedRight((prev) => (prev === rightId ? null : rightId))
  }

  function handleCheck() {
    if (submitted) return
    const newResults: MatchResult = {}
    let allCorrect = true
    for (const pair of exercise.pairs) {
      const correct = matches[pair.id] === pair.id
      newResults[pair.id] = correct ? 'correct' : 'wrong'
      if (!correct) allCorrect = false
    }
    setResults(newResults)
    setSubmitted(true)
    onResult(allCorrect, JSON.stringify(matches), Date.now() - startMs.current)
  }

  const recomputeConnections = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    const next: Connection[] = []
    for (const [leftId, rightId] of Object.entries(matches)) {
      const leftEl  = leftRefs.current.get(leftId)
      const rightEl = rightRefs.current.get(rightId)
      if (!leftEl || !rightEl) continue
      const lr = leftEl.getBoundingClientRect()
      const rr = rightEl.getBoundingClientRect()
      next.push({
        leftId, rightId,
        from: { x: lr.right - boardRect.left, y: lr.top + lr.height / 2 - boardRect.top },
        to:   { x: rr.left  - boardRect.left, y: rr.top + rr.height  / 2 - boardRect.top },
        state: results[leftId] ?? 'pending',
      })
    }
    setConnections(next)
  }, [matches, results])

  useIsoLayoutEffect(() => { recomputeConnections() }, [recomputeConnections, rightItems])

  useEffect(() => {
    startMs.current = Date.now()
  }, [exercise.id])

  useEffect(() => {
    const board = boardRef.current
    if (!board || typeof window === 'undefined') return
    const ro = new ResizeObserver(() => recomputeConnections())
    ro.observe(board)
    window.addEventListener('resize', recomputeConnections)
    window.addEventListener('scroll', recomputeConnections, true)
    return () => { ro.disconnect(); window.removeEventListener('resize', recomputeConnections); window.removeEventListener('scroll', recomputeConnections, true) }
  }, [recomputeConnections])

  const allMatched = exercise.pairs.every((p) => matches[p.id])

  function leftClass(pairId: string): string {
    const result     = results[pairId]
    const isSelected = selectedLeft === pairId
    const isMatched  = !!matches[pairId]
    const base = 'relative z-10 flex items-center gap-2.5 rounded-xl py-3 px-3 text-[14px] font-semibold border transition-all duration-200 text-left min-h-[48px] cursor-pointer'
    if (result === 'correct') return `${base} bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)] cursor-default`
    if (result === 'wrong')   return `${base} bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)] cursor-default`
    if (isSelected) return `${base} bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-sm`
    if (isMatched)  return `${base} bg-[var(--surface-raised)] border-[var(--primary)] border-opacity-40 text-[var(--text-primary)]`
    return `${base} bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--primary)]`
  }

  function rightClass(rightId: string): string {
    const leftId = Object.keys(matches).find((l) => matches[l] === rightId)
    const result = leftId ? results[leftId] : undefined
    const isArmed = armedRight === rightId
    const base = 'relative z-10 rounded-xl py-3 px-3 text-[13px] border transition-all duration-200 text-left min-h-[48px] cursor-pointer leading-snug'
    if (result === 'correct') return `${base} bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--text-secondary)] cursor-default`
    if (result === 'wrong')   return `${base} bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--text-secondary)] cursor-default`
    if (isArmed)  return `${base} bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--text-primary)] shadow-sm`
    if (!!leftId) return `${base} bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)]`
    return `${base} bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--primary)]`
  }

  function strokeFor(state: Connection['state'], leftId: string): string {
    if (state === 'correct') return 'var(--success)'
    if (state === 'wrong')   return 'var(--error)'
    return pairColor(leftId)
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <p className="text-center text-base font-semibold text-[var(--text-primary)]">
        Match each <span className="text-[var(--primary)]">word</span> with its definition
      </p>

      <div ref={boardRef} className="relative grid grid-cols-2 gap-x-10 gap-y-2">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          {connections.map((c) => {
            const midX   = (c.from.x + c.to.x) / 2
            const d      = `M ${c.from.x},${c.from.y} C ${midX},${c.from.y} ${midX},${c.to.y} ${c.to.x},${c.to.y}`
            const stroke = strokeFor(c.state, c.leftId)
            return (
              <g key={`${c.leftId}-${c.rightId}`}>
                <path d={d} stroke={stroke} strokeWidth={2} fill="none" strokeLinecap="round" opacity={c.state === 'pending' ? 0.7 : 1} />
                <circle cx={c.from.x} cy={c.from.y} r={3.5} fill={stroke} />
                <circle cx={c.to.x}   cy={c.to.y}   r={3.5} fill={stroke} />
              </g>
            )
          })}
        </svg>

        <div role="list" aria-label="Words" className="flex flex-col gap-2">
          {exercise.pairs.map((pair) => {
            const color = submitted
              ? (results[pair.id] === 'correct' ? 'var(--success)' : results[pair.id] === 'wrong' ? 'var(--error)' : 'var(--border-default)')
              : pairColor(pair.id)
            return (
              <button
                key={pair.id}
                ref={(el) => { if (el) leftRefs.current.set(pair.id, el); else leftRefs.current.delete(pair.id) }}
                type="button" role="listitem"
                aria-pressed={selectedLeft === pair.id || !!matches[pair.id]}
                aria-disabled={submitted || !!results[pair.id]}
                onClick={() => handleLeftClick(pair)}
                disabled={submitted || !!results[pair.id]}
                className={leftClass(pair.id)}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {pair.left}
              </button>
            )
          })}
        </div>

        <div role="list" aria-label="Definitions" className="flex flex-col gap-2">
          {rightItems.map((item) => {
            const matchedLeftId = Object.keys(matches).find((l) => matches[l] === item.id)
            const accentColor = matchedLeftId
              ? (submitted
                  ? (results[matchedLeftId] === 'correct' ? 'var(--success)' : 'var(--error)')
                  : pairColor(matchedLeftId))
              : 'var(--border-default)'
            return (
              <button
                key={item.id}
                ref={(el) => { if (el) rightRefs.current.set(item.id, el); else rightRefs.current.delete(item.id) }}
                type="button" role="listitem"
                aria-pressed={armedRight === item.id || !!matchedLeftId}
                aria-disabled={submitted}
                onClick={() => handleRightClick(item.id)}
                disabled={submitted}
                className={rightClass(item.id)}
                style={{ borderLeftColor: accentColor }}
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
          className="w-full rounded-full py-3.5 text-sm font-semibold transition-all disabled:opacity-40"
          style={{
            backgroundColor: allMatched ? 'var(--primary)' : 'var(--border-subtle)',
            color: allMatched ? 'var(--on-primary)' : 'var(--text-tertiary)',
          }}
        >
          Check
        </button>
      )}
    </div>
  )
}

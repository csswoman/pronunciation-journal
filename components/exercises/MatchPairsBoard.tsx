import type { RefObject } from 'react'
import { cn } from '@/lib/cn'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'

export type MatchResult = Record<string, 'correct' | 'wrong' | null>

type Endpoint = { x: number; y: number }
export type MatchConnection = {
  leftId: string
  rightId: string
  from: Endpoint
  to: Endpoint
  state: 'pending' | 'correct' | 'wrong'
}

type Pair = MatchPairsExerciseType['pairs'][number]

interface MatchPairsBoardProps {
  pairs: Pair[]
  rightItems: Array<{ id: string; label: string }>
  leftElements: Map<string, HTMLButtonElement>
  rightElements: Map<string, HTMLButtonElement>
  boardRef: RefObject<HTMLDivElement | null>
  selectedLeft: string | null
  armedRight: string | null
  matches: Record<string, string>
  results: MatchResult
  submitted: boolean
  connections: MatchConnection[]
  pairColor: (leftId: string) => string
  onLeftClick: (pair: Pair) => void
  onRightClick: (rightId: string) => void
}

const CARD_BASE =
  'relative z-10 flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all duration-200'

export function MatchPairsBoard({
  pairs,
  rightItems,
  leftElements,
  rightElements,
  boardRef,
  selectedLeft,
  armedRight,
  matches,
  results,
  submitted,
  connections,
  pairColor,
  onLeftClick,
  onRightClick,
}: MatchPairsBoardProps) {
  return (
    <div
      ref={boardRef}
      className="relative grid w-full grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-x-4 gap-y-2 sm:gap-x-6"
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
        {connections.map((connection) => {
          const midX = (connection.from.x + connection.to.x) / 2
          const path = `M ${connection.from.x},${connection.from.y} C ${midX},${connection.from.y} ${midX},${connection.to.y} ${connection.to.x},${connection.to.y}`
          const stroke = strokeFor(connection.state, connection.leftId, pairColor)
          return (
            <g key={`${connection.leftId}-${connection.rightId}`} className="animate-state-in">
              <path
                d={path}
                stroke={stroke}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={connection.state === 'pending' ? 0.75 : 1}
              />
              <circle cx={connection.from.x} cy={connection.from.y} r={3.5} fill={stroke} />
              <circle cx={connection.to.x} cy={connection.to.y} r={3.5} fill={stroke} />
            </g>
          )
        })}
      </svg>

      <div role="list" aria-label="Términos" className="flex flex-col gap-2">
        {pairs.map((pair) => (
          <button
            key={pair.id}
            ref={(element) => updateElementMap(leftElements, pair.id, element)}
            type="button"
            role="listitem"
            aria-pressed={selectedLeft === pair.id || !!matches[pair.id]}
            aria-disabled={submitted || !!results[pair.id]}
            onClick={() => onLeftClick(pair)}
            disabled={submitted || !!results[pair.id]}
            className={leftCardClass({ pairId: pair.id, selectedLeft, matches, results })}
          >
            <ColorDot color={dotColorForLeft(pair.id, matches, results, submitted, pairColor)} />
            <span className="text-sm font-semibold">{pair.left}</span>
          </button>
        ))}
      </div>

      <div role="list" aria-label="Definiciones" className="flex flex-col gap-2">
        {rightItems.map((item) => {
          const matchedLeftId = Object.keys(matches).find((leftId) => matches[leftId] === item.id)
          return (
            <button
              key={item.id}
              ref={(element) => updateElementMap(rightElements, item.id, element)}
              type="button"
              role="listitem"
              aria-pressed={armedRight === item.id || !!matchedLeftId}
              aria-disabled={submitted}
              onClick={() => onRightClick(item.id)}
              disabled={submitted}
              className={rightCardClass({ rightId: item.id, armedRight, matches, results })}
            >
              {matchedLeftId ? (
                <ColorDot
                  color={dotColorForLeft(matchedLeftId, matches, results, submitted, pairColor)}
                />
              ) : (
                <span className="size-2.5 shrink-0 rounded-full bg-border-default" aria-hidden />
              )}
              <span className="text-[13px] leading-snug text-fg-secondary">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function updateElementMap(
  elements: Map<string, HTMLButtonElement>,
  id: string,
  element: HTMLButtonElement | null,
) {
  if (element) elements.set(id, element)
  else elements.delete(id)
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
}: {
  pairId: string
  selectedLeft: string | null
  matches: Record<string, string>
  results: MatchResult
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
    !result && isSelected && 'border-primary bg-primary-soft text-primary shadow-sm',
    !result && isMatched && 'border-primary/40 bg-surface-raised text-fg',
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
}: {
  rightId: string
  armedRight: string | null
  matches: Record<string, string>
  results: MatchResult
}): string {
  const leftId = Object.keys(matches).find((candidate) => matches[candidate] === rightId)
  const result = leftId ? results[leftId] : undefined
  const isArmed = armedRight === rightId
  return cn(
    CARD_BASE,
    result === 'correct' &&
      'cursor-default border-success-border bg-success-soft pf-reveal-ok',
    result === 'wrong' &&
      'cursor-default border-error-border bg-error-soft pf-reveal-bad',
    !result && isArmed && 'border-primary bg-primary-soft text-fg shadow-sm',
    !result && leftId && 'border-border-default bg-surface-raised',
    !result &&
      !isArmed &&
      !leftId &&
      'border-border-default bg-surface-raised hover:border-primary',
  )
}

function strokeFor(
  state: MatchConnection['state'],
  leftId: string,
  pairColor: (id: string) => string,
): string {
  if (state === 'correct') return 'var(--success)'
  if (state === 'wrong') return 'var(--error)'
  return pairColor(leftId)
}

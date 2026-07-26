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
  'relative z-10 flex h-full min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-left transition-colors transition-transform duration-200 active:scale-[0.96] sm:min-h-12 sm:gap-2.5 sm:py-3'

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
      role="group"
      aria-label="Emparejar términos y definiciones"
      className="relative grid w-full grid-cols-1 gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-x-6"
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block">
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

      <section className="relative z-10 flex min-w-0 flex-col gap-2" aria-label="Términos">
        <p className="font-mono text-caption uppercase tracking-widest text-fg-subtle">Términos</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {pairs.map((pair) => (
            <button
              key={pair.id}
              ref={(element) => updateElementMap(leftElements, pair.id, element)}
              type="button"
              aria-label={`Término: ${pair.left}`}
              aria-pressed={selectedLeft === pair.id || !!matches[pair.id]}
              aria-disabled={submitted || !!results[pair.id]}
              onClick={() => onLeftClick(pair)}
              disabled={submitted || !!results[pair.id]}
              className={leftCardClass({ pairId: pair.id, selectedLeft, matches, results })}
            >
              <ColorDot color={dotColorForLeft(pair.id, matches, results, submitted, pairColor)} />
              <span className="text-body-sm font-semibold leading-snug wrap-break-word sm:text-body-sm">
                {pair.left}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="relative z-10 flex min-w-0 flex-col gap-2" aria-label="Definiciones mezcladas">
        <p className="font-mono text-caption uppercase tracking-widest text-fg-subtle">Definiciones mezcladas</p>
        <div className="flex min-w-0 flex-col gap-2">
          {rightItems.map((rightItem) => {
            const matchedLeftId = Object.keys(matches).find(
              (leftId) => matches[leftId] === rightItem.id,
            )
            const expandDefinition = submitted || armedRight === rightItem.id || !!matchedLeftId

            return (
            <button
              key={rightItem.id}
              ref={(element) => updateElementMap(rightElements, rightItem.id, element)}
              type="button"
              aria-label={`Definición: ${rightItem.label}`}
              aria-pressed={armedRight === rightItem.id || !!matchedLeftId}
              aria-disabled={submitted}
              title={rightItem.label}
              onClick={() => onRightClick(rightItem.id)}
              disabled={submitted}
              className={rightCardClass({ rightId: rightItem.id, armedRight, matches, results })}
            >
              {matchedLeftId ? (
                <ColorDot
                  color={dotColorForLeft(matchedLeftId, matches, results, submitted, pairColor)}
                />
              ) : (
                <span className="size-2.5 shrink-0 rounded-full bg-border-default" aria-hidden />
              )}
              <span
                className={cn( 'min-w-0 text-body-sm leading-snug text-pretty text-fg-secondary', expandDefinition ? 'line-clamp-none' : 'line-clamp-3', )}
              >
                {rightItem.label}
              </span>
            </button>
            )
          })}
        </div>
      </section>
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
    'items-start sm:items-center',
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

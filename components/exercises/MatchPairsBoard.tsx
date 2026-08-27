import type { RefObject } from 'react'
import { cn } from '@/lib/cn'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import type { MatchConnection, MatchResult } from './match-pairs-types'
import {
  ColorDot,
  dotColorForLeft,
  isIpaLabel,
  leftCardClass,
  rightCardClass,
  strokeFor,
  updateElementMap,
} from './match-pairs-board-helpers'

export type { MatchConnection, MatchResult } from './match-pairs-types'

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
      className="relative grid w-full grid-cols-2 gap-3 sm:gap-6"
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 block h-full w-full">
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

      <div className="relative z-10 flex min-w-0 flex-col gap-2.5 sm:gap-3" aria-label="Términos">
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
            <span className="min-w-0 text-body-sm font-semibold leading-snug wrap-break-word">
              {pair.left}
            </span>
          </button>
        ))}
      </div>

      <div className="relative z-10 flex min-w-0 flex-col gap-2.5 sm:gap-3" aria-label="Opciones">
        {rightItems.map((rightItem) => {
          const matchedLeftId = Object.keys(matches).find(
            (leftId) => matches[leftId] === rightItem.id,
          )
          const expandDefinition = submitted || armedRight === rightItem.id || !!matchedLeftId
          const isIpa = isIpaLabel(rightItem.label)

          return (
            <button
              key={rightItem.id}
              ref={(element) => updateElementMap(rightElements, rightItem.id, element)}
              type="button"
              aria-label={`Opción: ${rightItem.label}`}
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
                className={cn(
                  'min-w-0 leading-snug text-pretty',
                  isIpa
                    ? 'font-ipa text-body-base font-medium tracking-wide text-fg'
                    : 'text-body-sm text-fg-secondary',
                  expandDefinition ? 'line-clamp-none' : 'line-clamp-3',
                )}
              >
                {rightItem.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Planned structure:
// <MatchPairsBoard>
//   <MatchCard />  (columna izquierda: términos)
//   <MatchCard />  (columna derecha: opciones / IPA)
// </MatchPairsBoard>

import { cn } from '@/lib/cn'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import type { MatchResult } from './match-pairs-types'
import {
  isIpaLabel,
  matchCardClass,
  updateElementMap,
  type MatchCardState,
} from './match-pairs-board-helpers'

export type { MatchResult } from './match-pairs-types'

type Pair = MatchPairsExerciseType['pairs'][number]

interface MatchPairsBoardProps {
  pairs: Pair[]
  rightItems: Array<{ id: string; label: string }>
  leftElements: Map<string, HTMLButtonElement>
  rightElements: Map<string, HTMLButtonElement>
  selectedLeft: string | null
  armedRight: string | null
  matches: Record<string, string>
  results: MatchResult
  submitted: boolean
  onLeftClick: (pair: Pair) => void
  onRightClick: (rightId: string) => void
}

function CheckBadge() {
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-body-sm font-bold text-paper dark:bg-paper dark:text-ink"
    >
      ✓
    </span>
  )
}

function stateFor(
  active: boolean,
  matched: boolean,
  result: 'correct' | 'wrong' | null | undefined,
): MatchCardState {
  if (result === 'correct') return 'correct'
  if (result === 'wrong') return 'wrong'
  if (matched) return 'matched'
  return active ? 'active' : 'idle'
}

export function MatchPairsBoard({
  pairs,
  rightItems,
  leftElements,
  rightElements,
  selectedLeft,
  armedRight,
  matches,
  results,
  submitted,
  onLeftClick,
  onRightClick,
}: MatchPairsBoardProps) {
  return (
    <div
      role="group"
      aria-label="Emparejar términos y pronunciaciones"
      className="grid w-full grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-6"
    >
      <div className="flex min-w-0 flex-col gap-3" aria-label="Términos">
        {pairs.map((pair) => {
          const matched = !!matches[pair.id]
          const state = stateFor(selectedLeft === pair.id, matched, results[pair.id])
          return (
            <button
              key={pair.id}
              ref={(element) => updateElementMap(leftElements, pair.id, element)}
              type="button"
              aria-label={`Término: ${pair.left}`}
              aria-pressed={selectedLeft === pair.id || matched}
              disabled={submitted}
              onClick={() => onLeftClick(pair)}
              className={matchCardClass(state)}
            >
              <span className="min-w-0 text-body-md font-bold leading-snug wrap-break-word">
                {pair.left}
              </span>
              {matched && !submitted && <CheckBadge />}
            </button>
          )
        })}
      </div>

      <div className="flex min-w-0 flex-col gap-3" aria-label="Opciones">
        {rightItems.map((item) => {
          const leftId = Object.keys(matches).find((id) => matches[id] === item.id)
          const state = stateFor(
            armedRight === item.id,
            !!leftId,
            leftId ? results[leftId] : undefined,
          )
          return (
            <button
              key={item.id}
              ref={(element) => updateElementMap(rightElements, item.id, element)}
              type="button"
              aria-label={`Opción: ${item.label}`}
              aria-pressed={armedRight === item.id || !!leftId}
              disabled={submitted}
              onClick={() => onRightClick(item.id)}
              className={matchCardClass(state)}
            >
              <span
                className={cn(
                  'min-w-0 leading-snug text-pretty',
                  isIpaLabel(item.label)
                    ? 'font-ipa text-body-lg font-medium tracking-wide'
                    : 'text-body-md font-semibold',
                )}
              >
                {item.label}
              </span>
              {leftId && !submitted && <CheckBadge />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

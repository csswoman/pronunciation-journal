'use client'

// Planned structure:
// <MatchPairsMobileBoard>
//   <TermsBank />
//   <DefinitionsList />
// </MatchPairsMobileBoard>

import { cn } from '@/lib/cn'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import type { MatchResult } from './match-pairs-types'
import {
  ColorDot,
  dotColorForLeft,
  isIpaLabel,
  mobileDefinitionCardClass,
  mobileTermChipClass,
} from './match-pairs-board-helpers'

type Pair = MatchPairsExerciseType['pairs'][number]

interface MatchPairsMobileBoardProps {
  pairs: Pair[]
  rightItems: Array<{ id: string; label: string }>
  selection: {
    selectedLeft: string | null
    armedRight: string | null
    matches: Record<string, string>
    results: MatchResult
    submitted: boolean
  }
  pairColor: (leftId: string) => string
  onLeftClick: (pair: Pair) => void
  onRightClick: (rightId: string) => void
}

export function MatchPairsMobileBoard({
  pairs,
  rightItems,
  selection,
  pairColor,
  onLeftClick,
  onRightClick,
}: MatchPairsMobileBoardProps) {
  const { selectedLeft, armedRight, matches, results, submitted } = selection

  return (
    <div className="flex w-full flex-col gap-5 sm:hidden">
      {/* 1. Banco de Términos (Chips interactivos) */}
      <section aria-label="Términos para emparejar" className="flex flex-col gap-2">
        <header className="flex items-center justify-between">
          <span className="font-mono text-caption font-semibold uppercase tracking-wider text-fg-muted">
            Términos
          </span>
          {selectedLeft && (
            <span className="animate-state-in text-caption font-medium text-primary">
              Elige su definición abajo
            </span>
          )}
        </header>

        <div className="flex flex-wrap gap-2">
          {pairs.map((pair) => {
            const isSelected = selectedLeft === pair.id
            const isMatched = !!matches[pair.id]
            const result = results[pair.id]
            const color = dotColorForLeft(pair.id, matches, results, submitted, pairColor)

            return (
              <button
                key={pair.id}
                type="button"
                aria-label={`Término: ${pair.left}${isMatched ? ' (emparejado)' : ''}`}
                aria-pressed={isSelected || isMatched}
                aria-disabled={submitted || !!result}
                disabled={submitted || !!result}
                onClick={() => onLeftClick(pair)}
                className={mobileTermChipClass({
                  pairId: pair.id,
                  selectedLeft,
                  matches,
                  results,
                })}
              >
                <ColorDot color={color} />
                <span className="min-w-0 font-semibold text-body-sm">{pair.left}</span>
                {isMatched && !submitted && (
                  <span className="ml-0.5 text-caption font-semibold text-fg-muted" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. Lista de Definiciones a Ancho Completo */}
      <section aria-label="Definiciones y opciones" className="flex flex-col gap-2.5">
        <header className="flex items-center justify-between">
          <span className="font-mono text-caption font-semibold uppercase tracking-wider text-fg-muted">
            Definiciones
          </span>
          {armedRight && (
            <span className="animate-state-in text-caption font-medium text-primary">
              Elige el término arriba
            </span>
          )}
        </header>

        <div className="flex flex-col gap-3">
          {rightItems.map((rightItem) => {
            const matchedLeftId = Object.keys(matches).find(
              (leftId) => matches[leftId] === rightItem.id,
            )
            const matchedPair = matchedLeftId
              ? pairs.find((p) => p.id === matchedLeftId)
              : undefined
            const result = matchedLeftId ? results[matchedLeftId] : undefined
            const isArmed = armedRight === rightItem.id
            const isIpa = isIpaLabel(rightItem.label)

            return (
              <button
                key={rightItem.id}
                type="button"
                aria-label={
                  matchedPair
                    ? `Opción: ${rightItem.label}, emparejado con ${matchedPair.left}`
                    : `Opción: ${rightItem.label}`
                }
                aria-pressed={isArmed || !!matchedPair}
                aria-disabled={submitted}
                disabled={submitted}
                onClick={() => onRightClick(rightItem.id)}
                className={mobileDefinitionCardClass({
                  rightId: rightItem.id,
                  armedRight,
                  matches,
                  results,
                })}
              >
                {matchedPair ? (
                  <div className="flex w-full items-center justify-between gap-2 border-b border-border-subtle pb-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-surface-base px-2.5 py-1 text-caption font-semibold text-fg shadow-2xs">
                      <ColorDot
                        color={dotColorForLeft(
                          matchedPair.id,
                          matches,
                          results,
                          submitted,
                          pairColor,
                        )}
                      />
                      <span>{matchedPair.left}</span>
                    </div>

                    {!submitted && (
                      <span className="text-caption font-medium text-fg-muted">
                        Cambiar ✕
                      </span>
                    )}
                    {submitted && result === 'correct' && (
                      <span className="text-caption font-semibold text-success">Correcto</span>
                    )}
                    {submitted && result === 'wrong' && (
                      <span className="text-caption font-semibold text-error">Incorrecto</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-caption text-fg-muted">
                    <span className="size-2.5 shrink-0 rounded-full bg-border-default" aria-hidden />
                    <span>
                      {isArmed
                        ? 'Definición seleccionada · toca un término arriba'
                        : 'Toca para emparejar'}
                    </span>
                  </div>
                )}

                <p
                  className={cn(
                    'w-full text-left leading-relaxed text-pretty',
                    isIpa
                      ? 'font-ipa text-body-base font-medium tracking-wide text-fg'
                      : 'text-body-sm text-fg-secondary',
                  )}
                >
                  {rightItem.label}
                </p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

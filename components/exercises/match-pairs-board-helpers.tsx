import { cn } from '@/lib/cn'
import type { MatchConnection, MatchResult } from './match-pairs-types'

export const CARD_BASE =
  'relative z-10 flex h-full min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-left transition-colors transition-transform duration-200 active:scale-[0.96] sm:min-h-12 sm:gap-2.5 sm:py-3'

export function updateElementMap(
  elements: Map<string, HTMLButtonElement>,
  id: string,
  element: HTMLButtonElement | null,
) {
  if (element) elements.set(id, element)
  else elements.delete(id)
}

export function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

export function dotColorForLeft(
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

export function leftCardClass({
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

export function rightCardClass({
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

export function strokeFor(
  state: MatchConnection['state'],
  leftId: string,
  pairColor: (id: string) => string,
): string {
  if (state === 'correct') return 'var(--success)'
  if (state === 'wrong') return 'var(--error)'
  return pairColor(leftId)
}

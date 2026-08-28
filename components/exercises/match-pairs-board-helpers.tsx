import { cn } from '@/lib/cn'
import type { MatchConnection, MatchResult } from './match-pairs-types'

export const MATCH_DOT_COLORS = [
  'var(--match-pair-dot-1)',
  'var(--match-pair-dot-2)',
  'var(--match-pair-dot-3)',
  'var(--match-pair-dot-4)',
  'var(--match-pair-dot-5)',
  'var(--match-pair-dot-6)',
]

export const CARD_BASE =
  'relative z-10 flex w-full min-h-12 cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.98]'

export function updateElementMap(
  elements: Map<string, HTMLButtonElement>,
  id: string,
  element: HTMLButtonElement | null,
) {
  if (element) elements.set(id, element)
  else elements.delete(id)
}

export function isIpaLabel(label: string): boolean {
  const trimmed = label.trim()
  return trimmed.startsWith('/') && trimmed.endsWith('/')
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
    !result && isSelected && 'border-primary bg-primary-soft text-primary ring-1 ring-primary/30 shadow-xs font-medium',
    !result && isMatched && 'border-primary/40 bg-surface-raised text-fg',
    !result &&
      !isSelected &&
      !isMatched &&
      'border-border-default bg-surface-raised text-fg hover:border-primary/40 hover:bg-surface-base',
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
    result === 'correct' &&
      'cursor-default border-success-border bg-success-soft pf-reveal-ok',
    result === 'wrong' &&
      'cursor-default border-error-border bg-error-soft pf-reveal-bad',
    !result && isArmed && 'border-primary bg-primary-soft text-fg ring-1 ring-primary/30 shadow-xs',
    !result && leftId && 'border-primary/40 bg-surface-raised',
    !result &&
      !isArmed &&
      !leftId &&
      'border-border-default bg-surface-raised hover:border-primary/40 hover:bg-surface-base',
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

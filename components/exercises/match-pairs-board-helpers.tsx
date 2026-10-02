import { cn } from '@/lib/cn'

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

export type MatchCardState = 'idle' | 'active' | 'matched' | 'correct' | 'wrong'

export function matchCardClass(state: MatchCardState): string {
  return cn(
    'relative flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-5 py-3 text-left text-ink transition-colors duration-150 focus-ring active:scale-[0.98] dark:text-fg',
    state === 'idle' &&
      'border-transparent bg-ink/[0.07] hover:bg-ink/10 dark:bg-paper/10 dark:hover:bg-paper/15',
    state === 'active' && 'border-sky-deep bg-surface-raised',
    state === 'matched' && 'border-transparent bg-lilac dark:bg-lilac/30',
    state === 'correct' &&
      'cursor-default border-success-border bg-success-soft pf-reveal-ok',
    state === 'wrong' && 'cursor-default border-error-border bg-error-soft pf-reveal-bad',
  )
}

import { cn } from '@/lib/cn'

// Selected/unselected look shared by the word-search setup pickers (tokens only).
export function setupOptionClass(isSelected: boolean, extra?: string): string {
  return cn(
    'focus-ring cursor-pointer rounded-2xl text-left transition-all duration-150 active:scale-[0.98]',
    isSelected
      ? 'border-2 border-primary bg-primary-soft text-fg shadow-xs'
      : 'border-2 border-border-default bg-surface text-fg hover:border-border-strong',
    extra,
  )
}

export function setupOptionSubtitleClass(isSelected: boolean): string {
  return cn('font-sans text-body-sm', isSelected ? 'text-fg' : 'text-fg-muted')
}

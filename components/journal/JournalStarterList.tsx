import { cn } from '@/lib/cn'
import type { WritingScaffold } from '@/lib/journal/writing-scaffold'

export function JournalStarterList({
  starters,
  activeIndex,
  onSelectStarter,
}: {
  starters: WritingScaffold['sentence_starters']
  activeIndex: number
  onSelectStarter?: (starter: string) => void
}) {
  return (
    <ul className="flex flex-col gap-2">
      {starters.map((starter, index) => {
        const isSuggested = index === activeIndex
        return (
          <li
            key={starter.en}
            data-hint-active={isSuggested ? 'true' : undefined}
            className={cn(
              'rounded-[var(--radius-sm)] font-body-sm text-fg-muted',
              isSuggested && 'bg-primary-soft px-3 py-2 text-fg',
            )}
          >
            <button
              type="button"
              onClick={() => onSelectStarter?.(starter.en)}
              className="focus-ring min-h-11 w-full text-left"
            >
              <span className="text-fg">{starter.en}</span>
              <br />
              {starter.es}
            </button>
            {isSuggested ? (
              <span className="mt-1 block font-body-xs font-medium text-fg">Puedes seguir por aquí</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

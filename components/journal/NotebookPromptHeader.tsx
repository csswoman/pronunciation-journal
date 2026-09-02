import { RefreshCw } from '@/components/icons'
import type { PromptDefinition } from '@/lib/journal/notebook-types'

interface NotebookPromptHeaderProps {
  currentPrompt: PromptDefinition
  onShuffle: () => void
}

export function NotebookPromptHeader({
  currentPrompt,
  onShuffle,
}: NotebookPromptHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <h2
          id="today-page-heading"
          className="font-serif font-h3 font-normal leading-snug text-fg text-balance"
        >
          {currentPrompt.en}
        </h2>
        <button
          type="button"
          onClick={onShuffle}
          aria-label="Cambiar tema"
          title="Cambiar tema"
          className="group relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg-muted transition-all duration-150 hover:border-border-strong hover:bg-surface-raised hover:text-fg active:scale-95 focus-ring mt-1"
        >
          <RefreshCw
            size={13}
            className="transition-transform duration-300 group-hover:rotate-180"
            aria-hidden
          />
          {/* Tooltip al hacer hover o focus */}
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md border border-border-subtle bg-surface-overlay px-2 py-0.5 font-caption text-[11px] font-medium text-fg shadow-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 select-none z-20"
          >
            Cambiar tema
          </span>
        </button>
      </div>
      <p className="font-body-sm text-fg-muted">
        {currentPrompt.es}
      </p>
    </div>
  )
}

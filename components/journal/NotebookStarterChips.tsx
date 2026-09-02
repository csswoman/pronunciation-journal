interface NotebookStarterChipsProps {
  chips: string[]
  onInsert: (chip: string) => void
}

export function NotebookStarterChips({ chips, onInsert }: NotebookStarterChipsProps) {
  return (
    <div className="flex flex-col gap-2 animate-in fade-in-0 duration-200">
      <span className="font-tiny font-medium text-fg-muted uppercase tracking-wider">
        Toca una frase para empezar
      </span>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onInsert(chip)}
            className="focus-ring rounded-full border border-dashed border-border-subtle bg-surface-sunken px-3.5 py-1.5 font-mono text-xs text-fg transition-all duration-150 hover:border-border-strong hover:bg-surface-raised hover:scale-[1.02] active:scale-[0.98]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}

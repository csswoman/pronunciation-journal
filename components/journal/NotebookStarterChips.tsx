interface NotebookStarterChipsProps {
  chips: string[]
  onInsert: (chip: string) => void
}

export function NotebookStarterChips({ chips, onInsert }: NotebookStarterChipsProps) {
  return (
    <div className="flex flex-col gap-2.5 animate-in fade-in-0 duration-200">
      <span className="font-mono text-tiny font-bold text-ink uppercase tracking-wider select-none">
        TOCA UNA FRASE PARA EMPEZAR
      </span>
      <div className="flex flex-wrap gap-2.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onInsert(chip)}
            className="focus-ring rounded-full border-2 border-ink/20 bg-paper px-4 py-1.5 font-sans text-body-sm font-semibold text-ink transition-all duration-150 hover:border-ink hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer select-none"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}

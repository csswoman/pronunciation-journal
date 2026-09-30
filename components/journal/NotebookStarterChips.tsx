interface NotebookStarterChipsProps {
  chips: string[]
  onInsert: (chip: string) => void
}

export function NotebookStarterChips({ chips, onInsert }: NotebookStarterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2.5 pt-1 animate-in fade-in-0 duration-200">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onInsert(chip)}
          className="focus-ring inline-flex h-10.5 items-center rounded-full border-[1.5px] border-ink bg-paper px-4.5 font-sans text-body-sm font-semibold text-ink transition-all duration-150 hover:bg-paper/90 hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer select-none"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

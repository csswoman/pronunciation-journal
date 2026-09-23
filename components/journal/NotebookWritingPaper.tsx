'use client'

// Planned structure:
// <NotebookWritingPaper>
//   <LeftBinderMargin: 3 punch holes + vertical red line />
//   <RightPaperContent: Kicker label + Textarea with ruled lines />
// </NotebookWritingPaper>

interface NotebookWritingPaperProps {
  content: string
  onChange: (text: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
}

export function NotebookWritingPaper({
  content,
  onChange,
  onKeyDown,
  placeholder = 'Escribe en inglés. No importa si te equivocas: para eso está la revisión.',
}: NotebookWritingPaperProps) {
  return (
    <div className="relative w-full rounded-2xl border border-ink/15 bg-paper p-4 sm:p-5 shadow-xs overflow-hidden transition-all focus-within:border-ink/40">
      <div className="flex items-stretch gap-3 sm:gap-4">
        {/* Margen de cuaderno con 3 perforaciones y línea roja */}
        <div
          className="flex flex-col items-center justify-between border-r-2 border-coral-deep/40 pr-3 sm:pr-4 py-1 shrink-0 select-none"
          aria-hidden="true"
        >
          <div className="size-3 rounded-full bg-ink/10 border border-ink/20" />
          <div className="size-3 rounded-full bg-ink/10 border border-ink/20" />
          <div className="size-3 rounded-full bg-ink/10 border border-ink/20" />
        </div>

        {/* Área principal de texto con renglones */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span className="font-kicker font-bold uppercase tracking-wider text-ink-muted text-caption select-none">
            TU PÁGINA · TERMINA LA FRASE A TU MANERA
          </span>

          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={6}
            placeholder={placeholder}
            className="notebook-ruled-paper relative z-10 w-full resize-y bg-transparent p-0 font-sans text-base text-ink placeholder:font-sans placeholder:text-ink-muted/70 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

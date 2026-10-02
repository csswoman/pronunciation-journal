// Planned structure:
// <SpokenPhraseSteps>
//   <PhrasePill /> x3 (la tercera es opcional)
// </SpokenPhraseSteps>

const PHRASES = [
  { n: 1, label: 'Frase 1', optional: false },
  { n: 2, label: 'Frase 2', optional: false },
  { n: 3, label: 'Frase 3 (opcional)', optional: true },
] as const

/** Guía visual de cuántas frases encadenar en una narración hablada. */
export function SpokenPhraseSteps() {
  return (
    <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3" aria-label="Frases a decir">
      {PHRASES.map(({ n, label, optional }) => (
        <li
          key={n}
          className={
            optional
              ? 'flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-body-sm font-semibold text-fg-muted'
              : 'flex items-center gap-3 rounded-2xl bg-surface-sunken px-4 py-3.5 text-body-sm font-semibold text-fg-muted'
          }
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-border text-caption font-bold text-fg">
            {n}
          </span>
          {label}
        </li>
      ))}
    </ol>
  )
}

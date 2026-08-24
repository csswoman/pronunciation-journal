// Planned structure:
// <NotebookLearningsCard>
//   <Header: "Notas de tu camino" + kicker "Para recordar hoy" />
//   <TwoColumns:
//     <RecentRules: reglas gramaticales notadas recientemente />
//     <RecentWords: palabras nuevas sugeridas />
//   />
// </NotebookLearningsCard>

import { BookOpen, Sparkles } from '@/components/icons'

interface NotebookLearningsCardProps {
  learnings: {
    recentErrors: Array<{ quote: string; correction: string; type: string; explanationEs: string }>
    recentWords: string[]
  }
}

export function NotebookLearningsCard({ learnings }: NotebookLearningsCardProps) {
  const { recentErrors, recentWords } = learnings
  if (recentErrors.length === 0 && recentWords.length === 0) return null

  return (
    <details className="group rounded-[var(--radius-xl)] border border-border-subtle bg-surface-base p-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-caption font-semibold uppercase tracking-wider text-primary">
            Para recordar hoy
          </span>
          <h2 className="font-h4 font-medium text-fg">Notas de tus páginas anteriores</h2>
        </div>
        <span className="font-caption text-fg-muted transition-transform duration-150 ease-out-quart group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Columna 1: Puntos a tener en cuenta */}
        {recentErrors.length > 0 && (
          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3.5">
            <div className="flex items-center gap-2 text-fg">
              <BookOpen size={16} className="text-primary" aria-hidden />
              <h3 className="font-body-sm font-semibold">Detalles para poner en práctica</h3>
            </div>
            <ul className="flex flex-col gap-2 pt-1">
              {recentErrors.slice(0, 3).map((err, idx) => (
                <li key={`${err.quote}-${idx}`} className="flex flex-col gap-0.5 text-xs">
                  <div className="flex items-baseline gap-1.5 font-mono text-fg">
                    <span className="rounded bg-error-soft px-1.5 py-0.5 font-medium text-error">
                      {err.quote}
                    </span>
                    <span className="text-fg-muted">→</span>
                    <span className="rounded bg-success-soft px-1.5 py-0.5 font-medium text-success">
                      {err.correction}
                    </span>
                  </div>
                  <span className="text-fg-muted font-sans line-clamp-1">{err.explanationEs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Columna 2: Vocabulario cosechado */}
        {recentWords.length > 0 && (
          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3.5">
            <div className="flex items-center gap-2 text-fg">
              <Sparkles size={16} className="text-primary" aria-hidden />
              <h3 className="font-body-sm font-semibold">Vocabulario sugerido reciente</h3>
            </div>
            <p className="font-caption text-fg-muted">
              Intenta usar alguna de estas palabras en tu texto de hoy:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recentWords.slice(0, 5).map((word) => (
                <span
                  key={word}
                  className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-0.5 font-mono text-xs font-medium text-fg"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  )
}

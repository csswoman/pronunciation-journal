// Planned structure:
// <SessionDone>
//   <Headline />   — sesión completa / nada pendiente
//   <Stats />      — resumen breve
// </SessionDone>

import type { Core1000Stats } from '@/hooks/useCore1000Session'

interface Props {
  stats: Core1000Stats
  /** true cuando la cola estaba vacía desde el inicio */
  wasEmpty?: boolean
}

export function SessionDone({ stats, wasEmpty }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 text-center py-10">
      <h2 className="font-display text-h3 text-[var(--text-primary)] m-0">
        {wasEmpty ? 'Nada pendiente por hoy' : 'Sesión completa'}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] m-0">
        {stats.learned} de {stats.totalWords} palabras en tu deck · {stats.newToday}/{stats.newQuota} nuevas hoy
      </p>
      <p className="text-xs text-[var(--text-tertiary)] m-0">
        Vuelve mañana — el repaso espaciado hace el resto.
      </p>
    </div>
  )
}

// Planned structure:
// <UpcomingGamesPanel> — inert list of games still in development

import { UPCOMING_GAMES } from '@/lib/practice/practice-games'

export default function UpcomingGamesPanel() {
  return (
    <section
      aria-labelledby="upcoming-games-heading"
      className="rounded-[var(--radius-lg)] border border-dashed border-border-subtle bg-surface-sunken/40 p-5"
    >
      <div className="flex flex-col gap-1">
        <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">
          En desarrollo
        </span>
        <h2 id="upcoming-games-heading" className="text-body-sm font-semibold text-fg">
          Próximas mecánicas
        </h2>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {UPCOMING_GAMES.map((game) => (
          <li
            key={game.id}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-body-sm"
          >
            <span className="font-mono text-tiny text-fg-subtle">{game.title}</span>
            <span className="text-body-xs text-fg-muted">{game.description}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

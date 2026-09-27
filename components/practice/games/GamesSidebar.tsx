'use client'

// Planned structure:
// <GamesSidebar>
//   <SidebarHeader title="DISPONIBLES" />
//   <GamesList>
//     <GameItem key={game.id} ... />
//   </GamesList>
//   <Divider />
//   <SidebarHeader title="EN CAMINO" />
//   <UpcomingList />
// </GamesSidebar>

import { CloudRain, Grid2x2, Radio, Volume2, Zap, Target, Layers, ChevronRight } from '@/components/icons'
import { PRACTICE_GAMES, UPCOMING_GAMES, type PracticeGame } from '@/lib/practice/practice-games'

const GAME_ICONS: Record<string, typeof Grid2x2> = {
  'word-search': Grid2x2,
  'word-rain': CloudRain,
  'phoneme-invaders': Radio,
  'weak-form-catcher': Volume2,
  'chunk-duel': Zap,
  'false-friends-swipe': Target,
  'memory-match': Layers,
}

interface GamesSidebarProps {
  games: readonly PracticeGame[]
  selectedGameId: string
  onSelectGame: (gameId: string) => void
  bestScoreLabel?: string
}

export default function GamesSidebar({
  games = PRACTICE_GAMES,
  selectedGameId,
  onSelectGame,
  bestScoreLabel = '8 de 8 · 3:12',
}: GamesSidebarProps) {
  return (
    <section className="flex flex-col gap-2 rounded-3xl border border-border-default bg-surface-raised p-3.5 shadow-xs">
      <span className="px-2 pt-1 font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
        DISPONIBLES ({games.length})
      </span>

      <div className="flex flex-col gap-1 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
        {games.map((game) => {
          const isSelected = selectedGameId === game.id
          const Icon = GAME_ICONS[game.id] ?? Grid2x2

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => onSelectGame(game.id)}
              className={`group flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-150 active:scale-[0.98] focus-ring ${
                isSelected
                  ? 'bg-primary text-primary-fg shadow-xs'
                  : 'bg-transparent text-fg hover:bg-surface-sunken'
              }`}
            >
              <span
                className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-white/20 text-primary-fg'
                    : 'bg-surface-sunken text-fg'
                }`}
              >
                <Icon size={19} aria-hidden="true" />
              </span>

              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className="font-heading text-body-md font-bold leading-tight truncate">
                  {game.title}
                </span>
                <span
                  className={`text-caption truncate ${
                    isSelected ? 'opacity-90' : 'text-fg-muted'
                  }`}
                >
                  {game.kicker}
                </span>
              </div>

              <ChevronRight
                size={16}
                className={`shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${
                  isSelected ? 'text-primary-fg' : 'text-fg-subtle'
                }`}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>

      {UPCOMING_GAMES.length > 0 && (
        <>
          <div className="my-1.5 h-px bg-border-subtle" />

          <span className="px-2 pt-0.5 font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
            EN CAMINO
          </span>

          <div className="flex flex-col gap-1 opacity-80">
            {UPCOMING_GAMES.map((game) => (
              <div key={game.id} className="flex items-center gap-3 rounded-2xl p-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-fg-muted">
                  <Volume2 size={16} aria-hidden="true" />
                </span>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <span className="font-heading text-body-sm font-bold text-fg">
                    {game.title}
                  </span>
                  <span className="text-caption text-fg-muted truncate">
                    {game.description}
                  </span>
                </div>
                <span className="shrink-0 rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 font-sans text-tiny font-semibold text-fg-muted">
                  pronto
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-2 rounded-2xl bg-surface-sunken p-3.5 flex flex-col gap-0.5">
        <span className="text-caption text-fg-muted">Tu mejor tablero</span>
        <span className="font-heading text-xl font-extrabold text-fg">
          {bestScoreLabel}
        </span>
      </div>
    </section>
  )
}

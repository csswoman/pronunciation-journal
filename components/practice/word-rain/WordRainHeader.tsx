'use client'

// Planned structure:
// <WordRainHeader>
//   <HeaderLevelAndLives>
//     <LevelBadge />
//     <LivesIndicator />
//   </HeaderLevelAndLives>
//   <HeaderScoreAndStreak>
//     <ScoreDisplay />
//     <StreakBadge />
//   </HeaderScoreAndStreak>
//   <HeaderControls>
//     <AudioSpeakSwitch />
//     <PauseButton />
//     <ExitButton />
//   </HeaderControls>
// </WordRainHeader>

import type { CefrLevel } from '@/lib/essential-words/types'
import { Flame, Heart, Pause, Play, Volume2, X } from '@/components/icons'

export interface WordRainHeaderStats {
  lives: number
  maxLives: number
  score: number
  streak: number
}

interface WordRainHeaderProps {
  stats: WordRainHeaderStats
  level: CefrLevel
  isPaused: boolean
  speakOnMatch: boolean
  onToggleSpeak: () => void
  onTogglePause: () => void
  onExit: () => void
}

export default function WordRainHeader({
  stats,
  level,
  isPaused,
  speakOnMatch,
  onToggleSpeak,
  onTogglePause,
  onExit,
}: WordRainHeaderProps) {
  const { lives, maxLives, score, streak } = stats

  return (
    <header className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised px-3.5 py-3 shadow-xs flex-wrap sm:flex-nowrap">
      {/* Nivel y Vidas */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary-soft px-2.5 py-1 font-mono text-xs font-semibold text-primary">
          Nivel {level}
        </span>

        <div
          className="flex items-center gap-1"
          aria-label={`${lives} de ${maxLives} vidas restantes`}
        >
          {Array.from({ length: maxLives }).map((_, idx) => {
            const isAlive = idx < lives
            return (
              <Heart
                key={idx}
                size={18}
                className={`transition-all duration-300 ${
                  isAlive
                    ? 'fill-error text-error scale-100'
                    : 'fill-transparent text-border-strong opacity-40 scale-90'
                }`}
                aria-hidden="true"
              />
            )
          })}
        </div>
      </div>

      {/* Puntuación y Racha */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex flex-col items-center">
          <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">
            Puntos
          </span>
          <span className="font-mono text-body font-bold text-fg tabular-nums">
            {score}
          </span>
        </div>

        {streak >= 2 && (
          <div className="flex items-center gap-1 rounded-full bg-accent-1-soft px-2 py-0.5 text-accent-1 animate-pulse">
            <Flame size={14} className="fill-accent-1 text-accent-1" aria-hidden="true" />
            <span className="font-mono text-caption font-semibold tabular-nums">
              x{streak}
            </span>
          </div>
        )}
      </div>

      {/* Botones de control y Switch de audio */}
      <div className="flex items-center gap-2">
        {/* Switch de voz al escribir */}
        <button
          type="button"
          onClick={onToggleSpeak}
          role="switch"
          aria-checked={speakOnMatch}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-tiny font-medium transition-all focus-ring ${
            speakOnMatch
              ? 'border-primary/40 bg-primary-soft text-primary shadow-2xs'
              : 'border-border-subtle bg-surface text-fg-subtle opacity-70 hover:opacity-100'
          }`}
          title={speakOnMatch ? 'Voz al escribir: Activada' : 'Voz al escribir: Desactivada'}
        >
          <Volume2 size={14} className={speakOnMatch ? 'text-primary' : 'text-fg-subtle'} />
          <span className="hidden md:inline font-caption">
            {speakOnMatch ? 'Voz On' : 'Voz Off'}
          </span>
        </button>

        <button
          type="button"
          onClick={onTogglePause}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface hover:bg-surface-sunken text-fg-muted hover:text-fg transition-colors focus-ring"
          title={isPaused ? 'Reanudar juego' : 'Pausar juego'}
          aria-label={isPaused ? 'Reanudar juego' : 'Pausar juego'}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        <button
          type="button"
          onClick={onExit}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface hover:bg-surface-sunken text-fg-muted hover:text-fg transition-colors focus-ring"
          title="Salir del juego"
          aria-label="Salir del juego"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  )
}

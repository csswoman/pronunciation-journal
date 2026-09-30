'use client'

// Planned structure:
// <GameSessionBar>
//   <ExitLink />
//   <TitleAndProgress title progressLabel />
//   <StatSlot>{children}</StatSlot>
// </GameSessionBar>

import type { ReactNode } from 'react'
import Link from 'next/link'
import { X } from '@/components/icons'

interface GameSessionBarProps {
  title: string
  /** e.g. "Ronda 3 de 10"; omitted for endless games. */
  progressLabel?: string
  children?: ReactNode
}

export default function GameSessionBar({ title, progressLabel, children }: GameSessionBarProps) {
  return (
    <header className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-raised py-2 pl-2 pr-4">
      <Link
        href="/practice/games"
        aria-label="Salir del juego"
        className="grid size-11 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
      >
        <X size={20} aria-hidden />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-sans text-body-sm font-bold text-fg">{title}</span>
        {progressLabel && (
          <span className="font-sans text-caption tabular-nums text-fg-muted">{progressLabel}</span>
        )}
      </div>

      {children && <div className="flex shrink-0 items-center gap-4">{children}</div>}
    </header>
  )
}

interface GameSessionStatProps {
  label: string
  value: string | number
}

/** Compact label/value pair for the session bar. */
export function GameSessionStat({ label, value }: GameSessionStatProps) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-sans text-caption text-fg-muted">{label}</span>
      <span className="font-heading text-body-lg font-extrabold tabular-nums text-fg">{value}</span>
    </div>
  )
}

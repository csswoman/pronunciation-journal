'use client'

// Planned structure:
// <SessionReadyRecap> última línea compacta </SessionReadyRecap>

import type { LastEssentialWordsSession } from '@/lib/essential-words/ready-last-session'

interface Props {
  session: LastEssentialWordsSession
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function SessionReadyRecap({ session }: Props) {
  const time =
    session.durationMs > 0 ? ` · ${formatDuration(session.durationMs)}` : ''

  return (
    <p className="m-0 px-0.5 text-caption text-fg-muted">
      Última: {session.correct}/{session.practiced}
      {time}
    </p>
  )
}

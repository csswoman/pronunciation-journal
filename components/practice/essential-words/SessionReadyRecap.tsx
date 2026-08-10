'use client'

// Planned structure:
// <SessionReadyRecap> última línea con tono según precisión </SessionReadyRecap>

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

function recapLead(correct: number, practiced: number): string {
  if (practiced <= 0) return 'Última sesión'
  if (correct >= practiced) return 'Última: sin fallos'
  if (correct / practiced >= 0.8) return 'Última: buen ritmo'
  return 'Última sesión'
}

export function SessionReadyRecap({ session }: Props) {
  const time =
    session.durationMs > 0 ? ` · ${formatDuration(session.durationMs)}` : ''
  const lead = recapLead(session.correct, session.practiced)

  return (
    <p className="m-0 text-pretty text-caption tabular-nums text-fg-muted">
      {lead} · {session.correct}/{session.practiced}
      {time}
    </p>
  )
}

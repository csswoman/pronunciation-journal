'use client'

// Planned structure:
// <MissionHeader>
//   <RoleBadgeRow />
//   <GoalSummary />
//   <ContextAccordion />
// </MissionHeader>

import { useState } from 'react'
import { ArrowLeft } from '@/components/icons'
import type { ConversationalMission } from '@/lib/ai-practice/missions/types'

interface MissionHeaderProps {
  mission: ConversationalMission
  turnCount: number
  maxTurns: number
  onExit?: () => void
}

export function MissionHeader({ mission, turnCount, maxTurns, onExit }: MissionHeaderProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <header className="relative z-10 shrink-0 border-b border-border-subtle/70 bg-surface-raised/85 backdrop-blur-md px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Volver a misiones"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-caption font-medium text-fg-muted hover:text-fg hover:bg-surface-sunken/60 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={16} aria-hidden />
              <span>Volver</span>
            </button>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-fg truncate">
            <span className="text-fg-muted font-normal">Profesor:</span> {mission.role.model}
            <span className="text-border">·</span>
            <span className="text-primary font-medium">{mission.role.student}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xxs font-mono font-medium text-fg-muted bg-surface-base/80 border border-border-subtle px-2 py-0.5 rounded-full">
            {turnCount}/{maxTurns}
          </span>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
            aria-label="Ver detalles del objetivo"
            className="text-xs font-medium text-fg-muted hover:text-fg underline underline-offset-2 transition-colors cursor-pointer"
          >
            {showDetails ? 'Ocultar' : 'Info'}
          </button>
        </div>
      </div>

      <p className="mt-1 m-0 text-caption text-fg-muted truncate" title={mission.communicativeGoal}>
        {mission.communicativeGoal}
      </p>

      {showDetails && (
        <div className="mt-2 space-y-1 rounded-md border border-border-subtle bg-surface-base/90 p-2.5 text-caption animate-message-in shadow-xs">
          <p className="m-0 font-kicker text-fg-subtle text-xxs">SITUACIÓN</p>
          <p className="m-0 text-body-sm text-fg-muted">{mission.context}</p>
        </div>
      )}
    </header>
  )
}

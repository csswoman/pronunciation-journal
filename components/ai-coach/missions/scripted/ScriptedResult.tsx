'use client'

// Planned structure:
// <ScriptedResult>
//   <MissionTitle />
//   <ScoreDisplay />
//   <ImprovementNote />

import type { ScriptSessionScore } from '@/lib/ai-practice/missions/scripted/scoring'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'

interface Props {
  mission: ScriptedMission
  sessionScore: ScriptSessionScore
  /** Mejor score anterior en este mismo guión, si lo hay. */
  previousBest?: number | null
}

export function ScriptedResult({ mission, sessionScore, previousBest }: Props) {
  const improved =
    sessionScore.score !== null && previousBest != null && sessionScore.score > previousBest

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-raised p-5">
      <h2 className="text-label font-semibold text-fg">{mission.context}</h2>

      {sessionScore.score === null ? (
        <p className="text-body text-fg-muted">
          No se pudo evaluar la pronunciación en esta sesión.
        </p>
      ) : (
        <>
          <p className="text-display font-bold text-fg">{sessionScore.score}%</p>
          {previousBest != null && (
            <p className="text-body-sm text-fg-muted">
              {improved
                ? `Mejoraste: antes ${previousBest}%`
                : `Tu mejor marca sigue siendo ${previousBest}%`}
            </p>
          )}
        </>
      )}
    </div>
  )
}

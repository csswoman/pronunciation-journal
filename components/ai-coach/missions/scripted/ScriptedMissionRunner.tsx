'use client'

// Planned structure:
// <ScriptedMissionRunner>
//   <ScriptTranscript /> (dialogo recorrido, solo lectura)
//   <CoachLine />        (turno del coach)
//   <LearnerLine />      (turno del estudiante)
//   <ScriptedResult />   (puntuación final)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  advanceLine,
  createScriptState,
  currentLine,
  type ScriptState,
} from '@/lib/ai-practice/missions/scripted/script-state'
import { scoreScriptSession, type LineScore } from '@/lib/ai-practice/missions/scripted/scoring'
import {
  getPreviousBestScore,
  persistScriptedSession,
} from '@/lib/ai-practice/missions/scripted/persistence'
import { CoachLine } from './CoachLine'
import { ScriptTranscript } from './ScriptTranscript'
import { LearnerLine, type LineAttemptResult } from './LearnerLine'
import { ScriptedResult } from './ScriptedResult'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'
import type { WordResult } from '@/lib/types'

interface Props {
  mission: ScriptedMission
}

/** Cuenta fonemas acertados de una línea, para la puntuación ponderada. */
function toLineScore(lineId: string, wordResults: WordResult[]): LineScore {
  let correctPhonemes = 0
  let totalPhonemes = 0

  for (const word of wordResults) {
    const alignment = word.phonemes?.alignment
    if (!alignment?.length) {
      totalPhonemes += 1
      if (word.status === 'correct') correctPhonemes += 1
      continue
    }
    totalPhonemes += alignment.length
    correctPhonemes += alignment.filter((p) => p.status === 'correct').length
  }

  return { lineId, correctPhonemes, totalPhonemes }
}

export default function ScriptedMissionRunner({ mission }: Props) {
  const { user } = useAuth()
  const startedAtRef = useRef<string>(new Date().toISOString())
  const hasPersistedRef = useRef(false)

  const [state, setState] = useState<ScriptState>(() =>
    createScriptState(mission.id, mission.script))
  const [lineScores, setLineScores] = useState<LineScore[]>([])
  const [previousBest, setPreviousBest] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let active = true
    void getPreviousBestScore(user.id, mission.id).then((best) => {
      if (active) setPreviousBest(best)
    })
    return () => {
      active = false
    }
  }, [user?.id, mission.id])

  const handleLineComplete = useCallback(
    (result: LineAttemptResult | null) => {
      const line = currentLine(state)
      if (line && result) {
        setLineScores((previous) => [...previous, toLineScore(line.id, result.wordResults)])
      }
      setState(advanceLine(state))
    },
    [state],
  )

  const handleCoachContinue = useCallback(() => setState(advanceLine(state)), [state])

  const line = currentLine(state)
  const isCompleted = state.status === 'completed' || !line

  useEffect(() => {
    if (!isCompleted || hasPersistedRef.current || !user?.id) return
    hasPersistedRef.current = true
    const sessionScore = scoreScriptSession(lineScores)
    void persistScriptedSession(user.id, mission, sessionScore, startedAtRef.current)
  }, [isCompleted, user?.id, mission, lineScores])

  if (isCompleted) {
    const sessionScore = scoreScriptSession(lineScores)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ScriptedResult
          mission={mission}
          sessionScore={sessionScore}
          previousBest={previousBest}
        />
      </div>
    )
  }

  // El historial hace scroll; el turno activo queda fijo abajo. Si scrollaran
  // juntos, la linea que toca decir se saldria de pantalla segun crece el
  // dialogo — justo lo contrario de lo que la mision necesita.
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 [scrollbar-width:thin]">
        <ScriptTranscript script={state.script} currentIndex={state.currentIndex} />
      </div>
      <div className="shrink-0 border-t border-border-subtle bg-surface-base p-3">
        {line.speaker === 'coach'
          ? <CoachLine line={line} onContinue={handleCoachContinue} />
          : <LearnerLine line={line} onLineComplete={handleLineComplete} />}
      </div>
    </div>
  )
}

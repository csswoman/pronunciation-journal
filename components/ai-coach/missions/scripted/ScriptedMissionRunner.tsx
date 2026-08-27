'use client'

// Planned structure:
// <ScriptedMissionRunner>
//   <CoachLine />        (turno del coach)
//   <LearnerLine />      (turno del estudiante)
//   <ScriptedResult />   (puntuación final)

import { useCallback, useState } from 'react'
import {
  advanceLine,
  createScriptState,
  currentLine,
  type ScriptState,
} from '@/lib/ai-practice/missions/scripted/script-state'
import { scoreScriptSession, type LineScore } from '@/lib/ai-practice/missions/scripted/scoring'
import { CoachLine } from './CoachLine'
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
      // Sin datos de fonema, cae a binario por palabra.
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
  const [state, setState] = useState<ScriptState>(() =>
    createScriptState(mission.id, mission.script))
  const [lineScores, setLineScores] = useState<LineScore[]>([])

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

  if (state.status === 'completed' || !line) {
    return <ScriptedResult mission={mission} sessionScore={scoreScriptSession(lineScores)} />
  }

  return line.speaker === 'coach'
    ? <CoachLine line={line} onContinue={handleCoachContinue} />
    : <LearnerLine line={line} onLineComplete={handleLineComplete} />
}

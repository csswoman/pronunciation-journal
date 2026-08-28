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
import { ArrowLeft } from '@/components/icons'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'
import type { WordResult } from '@/lib/types'

interface Props {
  mission: ScriptedMission
  /** Sale de la misión y vuelve a la biblioteca. */
  onExit: () => void
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

// Planned structure:
// <ScriptedMissionRunner>
//   <ScriptedMissionHeader />
//   <ConversationStage>
//     <ScriptTranscript />
//     <ActiveSpeakerTurn />
//   </ConversationStage>
// </ScriptedMissionRunner>

export default function ScriptedMissionRunner({ mission, onExit }: Props) {
  const { user } = useAuth()
  const startedAtRef = useRef<string>(new Date().toISOString())
  const hasPersistedRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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

  // Repetir arranca un guión limpio, pero conserva `previousBest`: la gracia
  // de reintentar es ver si superas tu marca.
  const handleRetry = useCallback(() => {
    hasPersistedRef.current = false
    startedAtRef.current = new Date().toISOString()
    setLineScores([])
    setState(createScriptState(mission.id, mission.script))
  }, [mission])

  const line = currentLine(state)
  const isCompleted = state.status === 'completed' || !line

  useEffect(() => {
    if (!isCompleted || hasPersistedRef.current || !user?.id) return
    hasPersistedRef.current = true
    const sessionScore = scoreScriptSession(lineScores)
    void persistScriptedSession(user.id, mission, sessionScore, startedAtRef.current)
  }, [isCompleted, user?.id, mission, lineScores])

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [state.currentIndex])

  if (isCompleted) {
    const sessionScore = scoreScriptSession(lineScores)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <ScriptedResult
          mission={mission}
          sessionScore={sessionScore}
          previousBest={previousBest}
          onRetry={handleRetry}
          onExit={onExit}
        />
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden chat-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />

      <header className="relative z-10 shrink-0 border-b border-border-subtle/70 bg-surface-raised/85 backdrop-blur-md px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Volver a misiones"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-caption font-medium text-fg-muted hover:text-fg hover:bg-surface-sunken/60 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} aria-hidden />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="m-0 text-label font-semibold text-fg truncate">
              {mission.context}
            </h2>
            <span className="text-xxs font-mono font-medium text-fg-muted bg-surface-base/80 border border-border-subtle px-2 py-0.5 rounded-full shrink-0">
              {Math.min(state.currentIndex + 1, state.script.length)}/{state.script.length}
            </span>
          </div>
        </div>
      </header>

      <div
        role="region"
        aria-label="Diálogo de la misión guiada"
        tabIndex={0}
        className="@container relative z-10 flex-1 min-h-0 overflow-y-auto px-4 pt-6 pb-12 @[22rem]:px-6 space-y-5 [scrollbar-width:thin]"
      >
        <ScriptTranscript script={state.script} currentIndex={state.currentIndex} />
        <div className={state.currentIndex > 0 ? 'pt-1' : ''}>
          {line.speaker === 'coach'
            ? <CoachLine line={line} onContinue={handleCoachContinue} />
            : <LearnerLine line={line} onLineComplete={handleLineComplete} />}
        </div>
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </div>
  )
}

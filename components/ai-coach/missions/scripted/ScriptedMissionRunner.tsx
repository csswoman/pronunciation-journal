'use client'

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
import { fetchMissionLineAudio } from '@/lib/ai-practice/missions/scripted/audio-queries'
import { updateGeneratedScriptLineAudio } from '@/lib/ai-practice/missions/scripted/generated-store'
import type { WordResult } from '@/lib/types'
import PastelCard from '@/components/layout/PastelCard'
import { getIllustration } from '@/lib/illustrations/registry'
import { MISSION_CATEGORY_LABELS } from '../mission-category-labels'
import { getCategoryTone, getMissionIllustrationKey } from '../MissionCard'

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

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.onLine) return
    let active = true

    const coachLines = mission.script.filter((l) => l.speaker === 'coach' && !l.modelAudio?.path)
    if (coachLines.length === 0) return

    void Promise.all(
      coachLines.map(async (cl) => {
        try {
          const audioUrl = await fetchMissionLineAudio(cl, mission.id)
          if (!active || !audioUrl) return
          if (mission.id.startsWith('generated.')) {
            void updateGeneratedScriptLineAudio(mission.id, cl.id, audioUrl)
          }
          setState((prev) => ({
            ...prev,
            script: prev.script.map((s) =>
              s.id === cl.id ? { ...s, modelAudio: { path: audioUrl } } : s,
            ),
          }))
        } catch {
          // Swallow prefetch errors, will fall back cleanly in CoachLine
        }
      }),
    )

    return () => {
      active = false
    }
  }, [mission.id, mission.script])

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

  const illustrationKey = getMissionIllustrationKey(mission)
  const Illustration = getIllustration(illustrationKey)
  const tone = getCategoryTone(mission.category)
  const cefrUpper = mission.recommendedCefr.toUpperCase()

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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-surface-base">
      <header className="relative z-10 shrink-0 border-b border-border-subtle/70 bg-surface-raised/85 backdrop-blur-md px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Volver a misiones"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-base px-2.5 py-1 text-caption font-medium text-fg hover:text-fg hover:bg-surface-sunken hover:border-border-default transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <ArrowLeft size={16} aria-hidden />
            <span>Volver a misiones</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
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
        className="@container relative z-10 flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-12 @[22rem]:px-6 space-y-4 [scrollbar-width:thin]"
      >
        {/* Active Mission Hero Card */}
        <PastelCard
          tone={tone}
          className="relative flex flex-col justify-between gap-3 p-4 @[28rem]:p-5 overflow-hidden rounded-3xl group"
        >
          <div className="flex flex-col gap-2 min-w-0 z-10 max-w-xl">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
                {MISSION_CATEGORY_LABELS[mission.category]}
              </span>
              <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
                {cefrUpper}
              </span>
            </div>

            <div className="flex flex-col gap-1 pr-6">
              <h2 className="m-0 font-display text-base @[28rem]:text-lg font-extrabold text-ink leading-tight tracking-tight">
                {mission.communicativeGoal}
              </h2>
              <p className="m-0 text-xs text-ink-secondary text-pretty">
                {mission.context}
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -bottom-4 text-ink/15 transition-all duration-300 group-hover:scale-105 group-hover:text-ink/25 [&>svg]:h-36 @[28rem]:[&>svg]:h-44 [&>svg]:w-auto"
          >
            <Illustration />
          </div>
        </PastelCard>

        <ScriptTranscript
          script={state.script}
          currentIndex={state.currentIndex}
          missionId={mission.id}
        />
        <div className={state.currentIndex > 0 ? 'pt-1' : ''}>
          {line.speaker === 'coach'
            ? <CoachLine line={line} missionId={mission.id} onContinue={handleCoachContinue} />
            : <LearnerLine line={line} missionId={mission.id} onLineComplete={handleLineComplete} />}
        </div>
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </div>
  )
}

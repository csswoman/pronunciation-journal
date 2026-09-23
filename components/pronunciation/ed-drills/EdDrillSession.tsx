'use client'

// Planned structure:
// <EdDrillSession>
//   <ClusterProgressPills />
//   <Phase1PerceptionCard />
//   <Phase2LinkingCard />
//   <Phase3LadderCard />
// </EdDrillSession>

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { ED_DRILL_CATALOG } from '@/lib/pronunciation/ed-drills/catalog'
import { readClusterProgress, recordAttempt } from '@/lib/pronunciation/ed-drills/progress'
import { selectNextItem } from '@/lib/pronunciation/ed-drills/selector'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { EdCluster, EdClusterAttempt, EdDrillItem, EdEnvironment, UserEdClusterProgress } from '@/lib/pronunciation/ed-drills/types'
import { ClusterProgressPills } from './ClusterProgressPills'
import { Phase1PerceptionCard } from './Phase1PerceptionCard'
import { Phase2LinkingCard } from './Phase2LinkingCard'
import { Phase3LadderCard } from './Phase3LadderCard'

type SessionPhase = 1 | 2 | 3 | 'complete'

interface Props {
  /**
   * Señal de cierre para el contenedor (la diaria la necesita para marcar el
   * paso como hecho). En la ruta suelta se omite y la sesión ofrece repetir.
   */
  onComplete?: () => void
  /** Daily assigns one exact corrective cluster; the standalone route adapts. */
  cluster?: EdCluster
  /** Exact Daily step to reconcile only after evaluated practice. */
  dailyStepId?: string
}

export function EdDrillSession({ onComplete, cluster, dailyStepId }: Props = {}) {
  const auth = useAuthOptional()
  const userId = auth?.user?.id
  const [phase, setPhase] = useState<SessionPhase>(1)
  const [attempts, setAttempts] = useState<EdClusterAttempt[]>([])
  const [progressByCluster, setProgressByCluster] = useState<Map<EdDrillItem['cluster'], UserEdClusterProgress>>(new Map())
  const sessionId = useRef(crypto.randomUUID())
  const completedRef = useRef(false)

  const item = useMemo(
    () => ED_DRILL_CATALOG.find((entry) => entry.cluster === cluster)
      ?? selectNextItem(ED_DRILL_CATALOG, progressByCluster)
      ?? ED_DRILL_CATALOG[0],
    [cluster, progressByCluster],
  )
  const progress = progressByCluster.get(item.cluster)

  const refreshProgress = useCallback(async () => {
    if (!userId) return
    setProgressByCluster(await readClusterProgress(userId))
  }, [userId])

  useEffect(() => {
    void refreshProgress()
  }, [refreshProgress])

  const persistAttempt = useCallback(async (
    correct: boolean,
    level: EdEnvironment,
    attemptPhase: 1 | 2,
    suspectedEpenthesis = false,
  ) => {
    if (!userId) return null
    const next = await recordAttempt(userId, item.cluster, { correct, level, phase: attemptPhase, suspectedEpenthesis })
    setProgressByCluster((current) => new Map(current).set(item.cluster, next.progress))
    setAttempts((current) => [...current, next.attempt])
    return next.attempt
  }, [item.cluster, userId])

  const completeSession = useCallback(async () => {
    if (completedRef.current) return
    completedRef.current = true
    if (userId && attempts.length > 0) {
      const results = attempts.map((attempt) => ({
        exerciseId: `ed_cluster:${attempt.cluster}:phase:${attempt.phase}:${attempt.id}`,
        // This is an activity-only projection. It has no exerciseTypeId and is
        // never inserted into answer_history, so it does not claim a generic
        // exercise type for the specialised -ed task.
        slug: 'pick_sound' as const,
        exerciseTypeId: null,
        isCorrect: attempt.isCorrect,
        userAnswer: attempt.isCorrect ? 'correct' : 'incorrect',
        timeMs: 0,
        status: 'answered' as const,
        contentId: `ed_cluster:${attempt.cluster}`,
        context: dailyStepId ? 'daily' as const : 'practice' as const,
        exercisePayload: { phase: attempt.phase, suspectedEpenthesis: attempt.suspectedEpenthesis },
        completedAt: new Date(attempt.occurredAt),
      }))
      await recordActivitySession(userId, {
        practiceContext: dailyStepId ? 'daily' : 'practice',
        sessionResult: buildSessionResult(results),
        activitySessionId: sessionId.current,
        explicitSkillTags: ['pronunciation', 'listening'],
        explicitReconciledStepIds: dailyStepId ? [dailyStepId] : [],
      })
    }
    setPhase('complete')
  }, [attempts, dailyStepId, userId])

  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-success bg-success-soft layout-card-pad text-center">
        <h2 className="text-h3 text-fg">Escalera completada</h2>
        <p className="text-body-sm text-fg-muted">Tu siguiente práctica priorizará el cluster que más lo necesite.</p>
        <button
          type="button"
          onClick={() => (onComplete ? onComplete() : setPhase(1))}
          className="min-h-11 rounded-md bg-primary px-5 py-2 text-body-sm font-semibold text-on-primary transition-colors focus-ring hover:bg-primary-hover"
        >
          {onComplete ? 'Terminar paso' : 'Practicar otro cluster'}
        </button>
      </div>
    )
  }

  return (
    <section className="layout-stack-md w-full" aria-label="Ed Ladder Drill">
      <ClusterProgressPills progressByCluster={progressByCluster} />
      {phase === 1 ? <Phase1PerceptionCard item={item} onComplete={async (correct) => { await persistAttempt(correct, 1, 1); setPhase(2) }} /> : null}
      {phase === 2 ? <Phase2LinkingCard item={item} onComplete={async (result) => { if (result.scored) await persistAttempt(result.correct, 1, 2, result.suspectedEpenthesis); setPhase(3) }} /> : null}
      {phase === 3 ? <Phase3LadderCard item={item} unlockedLevel={progress?.unlockedLevel ?? 1} onComplete={() => { void completeSession() }} /> : null}
    </section>
  )
}

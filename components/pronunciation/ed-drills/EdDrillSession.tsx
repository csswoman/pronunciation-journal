'use client'

// Planned structure:
// <EdDrillSession>
//   <ClusterProgressPills />
//   <Phase1PerceptionCard />
//   <Phase2LinkingCard />
//   <Phase3LadderCard />
// </EdDrillSession>

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { ED_DRILL_CATALOG } from '@/lib/pronunciation/ed-drills/catalog'
import { readClusterProgress, recordAttempt } from '@/lib/pronunciation/ed-drills/progress'
import { selectNextItem } from '@/lib/pronunciation/ed-drills/selector'
import type { EdDrillItem, EdEnvironment, UserEdClusterProgress } from '@/lib/pronunciation/ed-drills/types'
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
}

export function EdDrillSession({ onComplete }: Props = {}) {
  const auth = useAuthOptional()
  const userId = auth?.user?.id
  const [phase, setPhase] = useState<SessionPhase>(1)
  const [progressByCluster, setProgressByCluster] = useState<Map<EdDrillItem['cluster'], UserEdClusterProgress>>(new Map())

  const item = useMemo(
    () => selectNextItem(ED_DRILL_CATALOG, progressByCluster) ?? ED_DRILL_CATALOG[0],
    [progressByCluster],
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
    suspectedEpenthesis = false,
  ) => {
    if (!userId) return
    const next = await recordAttempt(userId, item.cluster, { correct, level, suspectedEpenthesis })
    setProgressByCluster((current) => new Map(current).set(item.cluster, next))
  }, [item.cluster, userId])

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
      {phase === 1 ? <Phase1PerceptionCard item={item} onComplete={(correct) => { void persistAttempt(correct, 1); setPhase(2) }} /> : null}
      {phase === 2 ? <Phase2LinkingCard item={item} onComplete={(result) => { if (result.scored) void persistAttempt(result.correct, 1, result.suspectedEpenthesis); setPhase(3) }} /> : null}
      {phase === 3 ? <Phase3LadderCard item={item} unlockedLevel={progress?.unlockedLevel ?? 1} onComplete={() => setPhase('complete')} /> : null}
    </section>
  )
}

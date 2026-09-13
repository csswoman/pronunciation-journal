'use client'

import { useCallback, useEffect, useMemo } from 'react'
import DailyPlanCard from '@/components/daily/DailyPlanCard'
import HomeFirstSessionHint from '@/components/home/HomeFirstSessionHint'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'
import type { SessionArc } from '@/lib/practice/types'
import type { PrimaryAction } from '@/lib/home/primary-action'
import type { WeakestPhonemeHome } from '@/lib/home/constants'

/** Review kinds already surfaced as plan step 01 — banner would duplicate the CTA. */
const REVIEW_ENTRY_KINDS = new Set(['word_review', 'word_intro'])

export interface HomePlanStatus {
  empty: boolean
  settled: boolean
  reviewIsEntry: boolean
  conceptSlug: string | null
  allDone: boolean
  arc: SessionArc | undefined
  stepCount: number
  completedCount: number
}

export interface HomeDailyCardProps {
  conceptLesson: ConceptLesson | null
  reviewDue?: boolean
  isNewLearner?: boolean
  showFirstSessionHint?: boolean
  onPlanStatusChange?: (status: HomePlanStatus) => void
  hideSegmentProgress?: boolean
  primaryAction?: PrimaryAction | null
  weakestPhoneme?: WeakestPhonemeHome | null
  customEmptyState?: React.ReactNode
  customPrefix?: React.ReactNode
  needsPlacement?: boolean
  needsPronunciation?: boolean
  onStartStep?: (step: DailyStep) => void
  planState?: ReturnType<typeof useDailyPlan>
}

function isReviewEntryStep(step: DailyStep | undefined): boolean {
  if (!step) return false
  if (REVIEW_ENTRY_KINDS.has(step.kind)) return true
  return step.id.startsWith('review_sound:') || step.id === 'failed_sentences'
}

function HomeDailyCardView({
  reviewDue = false,
  isNewLearner = false,
  showFirstSessionHint = false,
  onPlanStatusChange,
  primaryAction = null,
  weakestPhoneme = null,
  customEmptyState,
  customPrefix,
  needsPlacement = false,
  needsPronunciation = false,
  onStartStep,
  planState,
}: HomeDailyCardProps & { planState: ReturnType<typeof useDailyPlan> }) {
  const { user } = useAuth()
  const { status, steps, getStepStatus, completedCount, allDone, arc, load } = planState

  const entryStep = useMemo(() => {
    return steps.find((s) => {
      const st = getStepStatus(s.id)
      return st !== 'done' && st !== 'resolved'
    })
  }, [steps, getStepStatus])

  const reviewIsEntry = isReviewEntryStep(entryStep)
  const conceptSlug =
    steps.find((s) => s.kind === 'concept' && s.id.startsWith('concept:'))?.id.replace(/^concept:/, '') ??
    null
  const demoteEntryHighlight = reviewDue && !reviewIsEntry

  useEffect(() => {
    if (!onPlanStatusChange) return
    if (status === 'loading' || status === 'idle') {
      onPlanStatusChange({
        empty: false,
        settled: false,
        reviewIsEntry: false,
        conceptSlug: null,
        allDone: false,
        arc: undefined,
        stepCount: 0,
        completedCount: 0,
      })
      return
    }
    const empty = status === 'ready' && !allDone && steps.length === 0
    onPlanStatusChange({
      empty,
      settled: status === 'ready' || status === 'error',
      reviewIsEntry: status === 'ready' && reviewIsEntry,
      conceptSlug: status === 'ready' ? conceptSlug : null,
      allDone: status === 'ready' && allDone,
      arc: status === 'ready' ? arc : undefined,
      stepCount: steps.length,
      completedCount,
    })
  }, [status, allDone, steps.length, completedCount, reviewIsEntry, conceptSlug, arc, onPlanStatusChange])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    if (onStartStep) {
      onStartStep(step)
    } else {
      try {
        sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))
      } catch { /* quota errors: ignore */ }
    }
  }, [onStartStep])

  const enrichedSteps = useMemo(() => {
    if (!weakestPhoneme) return steps
    const cleanIpa = (weakestPhoneme.ipa || '').replace(/^\/+|\/+$/g, '')
    const confusableClean = (weakestPhoneme.confusableIpa || '').replace(/^\/+|\/+$/g, '')
    const isPersonalized = Boolean(user && !isNewLearner && !needsPronunciation)
    return steps.map((s) => {
      const isSoundStep = s.kind.includes('sound') || s.id.includes('sound') || s.kind === 'phoneme_focus'
      if (!isSoundStep) return s
      const stepIpa = (s.ipa || cleanIpa).replace(/^\/+|\/+$/g, '')
      const confusableText = confusableClean
        ? (isPersonalized ? `Lo confundes con /${confusableClean}/` : `Suele confundirse con /${confusableClean}/`)
        : (isPersonalized ? s.subtitle : 'Sonido difícil para hispanohablantes')
      return {
        ...s,
        ipa: stepIpa,
        title: 'Práctica de sonido',
        subtitle: confusableText,
      }
    })
  }, [steps, weakestPhoneme, user, isNewLearner, needsPronunciation])

  return (
    <DailyPlanCard
      status={status}
      steps={enrichedSteps}
      getStepStatus={getStepStatus}
      completedCount={completedCount}
      allDone={allDone}
      onStartStep={handleStartStep}
      onRetry={() => void load()}
      collapseFutureSteps
      reviewDue={reviewDue}
      isNewLearner={isNewLearner}
      demoteEntryHighlight={demoteEntryHighlight}
      showTitle={false}
      primaryAction={primaryAction}
      hideThreadHints
      customEmptyState={customEmptyState}
      arc={arc}
      needsPlacement={needsPlacement}
      needsPronunciation={needsPronunciation}
      listPrefix={
        <>
          {customPrefix}
          <HomeFirstSessionHint enabled={showFirstSessionHint} />
        </>
      }
    />
  )
}

function HomeDailyCardWithPlan(props: HomeDailyCardProps) {
  const { user } = useAuth()
  const planState = useDailyPlan({
    conceptLesson: props.conceptLesson,
    autoLoad: false,
  })

  useEffect(() => {
    if (user && planState.status === 'idle') void planState.load()
  }, [user, planState.status, planState.load])

  useEffect(() => {
    if (planState.allDone) planState.celebrate()
  }, [planState.allDone, planState.celebrate])

  return <HomeDailyCardView {...props} planState={planState} />
}

export default function HomeDailyCard(props: HomeDailyCardProps) {
  if (props.planState) {
    return <HomeDailyCardView {...props} planState={props.planState} />
  }
  return <HomeDailyCardWithPlan {...props} />
}

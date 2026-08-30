'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DailyPlanCard from '@/components/daily/DailyPlanCard'
import HomeFirstSessionHint from '@/components/home/HomeFirstSessionHint'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { isPermanentUser } from '@/lib/auth/is-anonymous'
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
}

interface HomeDailyCardProps {
  conceptLesson: ConceptLesson | null
  reviewDue?: boolean
  isNewLearner?: boolean
  showFirstSessionHint?: boolean
  onPlanStatusChange?: (status: HomePlanStatus) => void
  hideSegmentProgress?: boolean
  primaryAction?: PrimaryAction | null
  weakestPhoneme?: WeakestPhonemeHome | null
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

function isReviewEntryStep(step: DailyStep | undefined): boolean {
  if (!step) return false
  if (REVIEW_ENTRY_KINDS.has(step.kind)) return true
  return step.id.startsWith('review_sound:') || step.id === 'failed_sentences'
}

export default function HomeDailyCard({
  conceptLesson,
  reviewDue = false,
  isNewLearner = false,
  showFirstSessionHint = false,
  onPlanStatusChange,
  primaryAction = null,
  weakestPhoneme = null,
}: HomeDailyCardProps) {
  const { user } = useAuth()
  const { preferences } = useUserPreferences()
  const router = useRouter()
  const { status, steps, getStepStatus, completedCount, allDone, arc, load, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })

  useEffect(() => {
    if (user && status === 'idle') void load()
  }, [user, status, load])

  useEffect(() => {
    if (allDone) celebrate()
  }, [allDone, celebrate])

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
    })
  }, [status, allDone, steps.length, reviewIsEntry, conceptSlug, arc, onPlanStatusChange])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    try {
      sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))
    } catch { /* quota errors: ignore */ }
    router.push(`/daily?step=${step.id}`)
  }, [router])

  const userName = isPermanentUser(user)
    ? preferences?.full_name?.trim().split(/\s+/)[0] ||
      user?.email?.split('@')[0] ||
      null
    : null
  const greetingText = getGreeting()
  const greeting = userName ? `${greetingText}, ${userName}` : greetingText

  const enrichedSteps = useMemo(() => {
    if (!weakestPhoneme) return steps
    const cleanIpa = (weakestPhoneme.ipa || '').replace(/^\/+|\/+$/g, '')
    const confusableClean = (weakestPhoneme.confusableIpa || '').replace(/^\/+|\/+$/g, '')
    return steps.map((s) => {
      const isSoundStep = s.kind.includes('sound') || s.id.includes('sound') || s.kind === 'phoneme_focus'
      if (!isSoundStep) return s
      const stepIpa = (s.ipa || cleanIpa).replace(/^\/+|\/+$/g, '')
      return {
        ...s,
        ipa: stepIpa,
        title: 'Práctica de sonido',
        subtitle: confusableClean ? `Lo confundes con /${confusableClean}/` : s.subtitle,
      }
    })
  }, [steps, weakestPhoneme])

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
      greeting={greeting}
      primaryAction={primaryAction}
      hideThreadHints
      listPrefix={<HomeFirstSessionHint enabled={showFirstSessionHint} />}
    />
  )
}

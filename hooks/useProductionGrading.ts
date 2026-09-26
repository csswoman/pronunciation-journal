'use client'

/**
 * Single entry point for AI-graded production exercises (Plan 037 C2).
 * Every attempt goes through the local-first pipeline, and the AI branch is
 * gated by the retry budget, so a resubmission never pays twice.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import {
  isOnline,
  ProductionGradeError,
  type GradeProductionInput,
  type ProductionGradeResult,
} from '@/lib/exercises/grade-production-client'
import {
  AiGradingBlockedError,
  assertAiGradeAllowed,
  MAX_AI_GRADES_PER_EXERCISE,
  type AttemptHistory,
} from '@/lib/exercises/grading-attempts'
import {
  createMemoryGradingDeps,
  dexieGradingDeps,
  gradeWithLocalFirst,
  type GradingPipelineDeps,
} from '@/lib/exercises/grading-pipeline'

const ANONYMOUS_USER_ID = 'anonymous'
const GENERIC_ERROR_MESSAGE = 'No se pudo corregir. Inténtalo de nuevo.'

export interface ProductionGradingTarget {
  /** Stable identity of the exercise; scopes the cache and the retry budget. */
  exerciseKey: string
  /** Reference plus alternative answers accepted without asking the AI. */
  acceptedAnswers?: readonly string[]
  /** Transformation source, to reject an untouched sentence locally. */
  sourceSentence?: string
  /** True when the exercise has one fixed solution (translation, transformation). */
  fixedReference?: boolean
  /** Shown instead of the default message when the AI branch needs network. */
  offlineMessage?: string
}

export interface ProductionGradingApi {
  grading: boolean
  error: string | null
  /** AI calls already spent on this exercise during this session. */
  aiGrades: number
  /** No requests left: the learner self-assesses against the reference. */
  aiBudgetSpent: boolean
  /** Returns null when the attempt was answered with a local message. */
  grade: (input: GradeProductionInput) => Promise<ProductionGradeResult | null>
  clearError: () => void
}

export function useProductionGrading(target: ProductionGradingTarget): ProductionGradingApi {
  const auth = useAuthOptional()
  const userId = auth?.user?.id ?? null
  const targetRef = useRef(target)
  targetRef.current = target

  const [grading, setGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiGrades, setAiGrades] = useState(0)
  const history = useRef<AttemptHistory>({ lastProduction: null, aiGrades: 0 })

  const deps: GradingPipelineDeps = useMemo(
    () => (userId ? dexieGradingDeps : createMemoryGradingDeps()),
    [userId],
  )

  useEffect(() => {
    history.current = { lastProduction: null, aiGrades: 0 }
    setAiGrades(0)
    setError(null)
    setGrading(false)
  }, [target.exerciseKey])

  const grade = useCallback(
    async (input: GradeProductionInput): Promise<ProductionGradeResult | null> => {
      const current = targetRef.current
      setGrading(true)
      setError(null)
      try {
        const result = await gradeWithLocalFirst(
          {
            userId: userId ?? ANONYMOUS_USER_ID,
            exerciseKey: current.exerciseKey,
            gradeInput: input,
            acceptedAnswers: current.acceptedAnswers,
            sourceSentence: current.sourceSentence,
            fixedReference: current.fixedReference,
            beforeAiCall: () => {
              assertAiGradeAllowed(input.production, history.current, isOnline())
              // Counted before the request: a failed call may still have spent
              // quota, and retrying it forever is what this budget prevents.
              history.current.aiGrades += 1
              setAiGrades(history.current.aiGrades)
            },
          },
          deps,
        )
        return result
      } catch (cause) {
        setError(errorMessage(cause, current.offlineMessage))
        return null
      } finally {
        history.current.lastProduction = input.production
        setGrading(false)
      }
    },
    [deps, userId],
  )

  return {
    grading,
    error,
    aiGrades,
    aiBudgetSpent: aiGrades >= MAX_AI_GRADES_PER_EXERCISE,
    grade,
    clearError: useCallback(() => setError(null), []),
  }
}

function errorMessage(cause: unknown, offlineMessage?: string): string {
  if (cause instanceof AiGradingBlockedError) {
    return cause.reason === 'offline' && offlineMessage ? offlineMessage : cause.message
  }
  if (cause instanceof ProductionGradeError) {
    return cause.code === 'offline' && offlineMessage ? offlineMessage : cause.message
  }
  return GENERIC_ERROR_MESSAGE
}

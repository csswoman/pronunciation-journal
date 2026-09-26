'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { normalize } from '@/lib/exercises/answer-match'
import { reportWrongFeedback } from '@/lib/ai-feedback/report'

export function useAcceptedAnswers(exerciseKey: string, userId: string = 'anon'): string[] {
  const answers = useLiveQuery(
    async () => {
      if (!exerciseKey) return []
      try {
        const rows = await db.gradedAnswers
          .where('exerciseKey')
          .equals(exerciseKey)
          .filter((r) => r.accepted === 1 && (userId === 'anon' || r.userId === userId || r.userId === 'anon'))
          .toArray()
        return rows.map((r) => r.normalized)
      } catch {
        return []
      }
    },
    [exerciseKey, userId],
    [],
  )

  return answers ?? []
}

export async function saveAcceptedAnswer({
  userId = 'anon',
  exerciseKey,
  answer,
  canonical,
  reportToAiFeedback = true,
}: {
  userId?: string
  exerciseKey: string
  answer: string
  canonical?: string
  reportToAiFeedback?: boolean
}): Promise<void> {
  const norm = normalize(answer)
  const key = `${userId}:${exerciseKey}:${norm}`

  await db.gradedAnswers.put({
    key,
    userId,
    exerciseKey,
    normalized: norm,
    result: {
      correct: true,
      usedTarget: true,
      grammaticallyCorrect: true,
      constraintMet: true,
      feedback: '¡Respuesta aceptada por ti!',
      score: 70,
    },
    createdAt: new Date().toISOString(),
    accepted: 1,
  })

  if (reportToAiFeedback) {
    try {
      await reportWrongFeedback({
        userId,
        feature: 'production_grade',
        promptVersion: 'plan-043-local',
        input: {
          exerciseKey,
          answer,
          canonical,
        },
        output: {
          verdict: 'no_match',
          selfApproved: true,
        },
        comment: 'El alumno indicó que su respuesta también es correcta.',
      })
    } catch {
      // Offline o error no bloqueante al registrar feedback
    }
  }
}

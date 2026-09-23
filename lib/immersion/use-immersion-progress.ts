'use client';

// Engancha el marcado de progreso de inmersión a la UI: sin esto,
// markImmersionLessonWatched nunca se llamaba y el plan diario no podía
// excluir lecciones ya vistas. Se dispara al completar el video o el quiz.
import { useCallback, useRef } from 'react';
import { useAuthOptional } from '@/components/auth/AuthProvider';
import {
  markImmersionLessonWatched,
  recordImmersionQuizAttempt,
  recordImmersionQuizScore,
  type ImmersionQuizAttemptInput,
} from './progress-queries';

export function useImmersionProgress(lessonId: string) {
  const auth = useAuthOptional();
  const userId = auth?.user?.id ?? null;
  const markedRef = useRef(false);

  const markWatched = useCallback(() => {
      if (!userId || markedRef.current) return;
      markedRef.current = true;
      markImmersionLessonWatched(userId, lessonId).catch((err) => {
        console.error('[useImmersionProgress] Error marking lesson watched:', err);
        markedRef.current = false;
      });
    },
    [userId, lessonId],
  );

  const recordQuiz = useCallback(async (input: Omit<ImmersionQuizAttemptInput, 'lessonId'>) => {
    if (!userId) return
    const correct = input.answers.filter((answer) => answer.isCorrect).length
    const scorePercent = Math.round((correct / input.answers.length) * 100)
    await Promise.all([
      recordImmersionQuizAttempt(userId, { ...input, lessonId }),
      recordImmersionQuizScore(userId, lessonId, scorePercent),
    ])
  }, [userId, lessonId])

  return { markWatched, recordQuiz };
}

import { describe, expect, it } from 'vitest'
import { dailyStepAnalyticsPayload, summarizeDailyPilotActivity } from '../analytics'

describe('telemetría del plan diario', () => {
  it('registra composición y salida sin declarar dominio', () => {
    expect(dailyStepAnalyticsPayload({
      id: 'intro_chunks:hello', kind: 'chunk_intro', title: '', subtitle: '', icon: '', estMinutes: 1,
      exercises: [{ id: 'one' }, { id: 'two' }] as never,
      chunks: [{ id: 'hello' }] as never,
    }, 1)).toEqual({
      stepId: 'intro_chunks:hello',
      stepKind: 'chunk_intro',
      exerciseCount: 2,
      chunkIds: ['hello'],
      completedExercises: 1,
    })
  })

  it('separates new chunks, review and explicit early exits without calling them mastery', () => {
    const intro = { stepId: 'intro', stepKind: 'chunk_intro', exerciseCount: 2, chunkIds: ['one'] }
    const review = { stepId: 'review', stepKind: 'chunk_review', exerciseCount: 3, chunkIds: ['two'] }
    expect(summarizeDailyPilotActivity([
      { name: 'daily_step_started', payload: intro },
      { name: 'daily_step_completed', payload: intro },
      { name: 'daily_step_started', payload: review },
      { name: 'daily_step_exited', payload: { ...review, completedExercises: 1 } },
    ])).toEqual({
      startedSteps: 2,
      completedSteps: 1,
      exitedBeforeCompletion: 1,
      startedChunkIntroductions: 1,
      startedChunkReviews: 1,
    })
  })
})

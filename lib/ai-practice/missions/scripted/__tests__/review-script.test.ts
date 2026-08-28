import { describe, expect, it } from 'vitest'
import { buildReviewScriptRequest, MIN_WEAKNESSES_FOR_REVIEW } from '../review-script'
import { emptyLearnerContext } from '@/lib/ai-coach/learner-context'

describe('buildReviewScriptRequest', () => {
  it('devuelve null sin historial suficiente', () => {
    expect(buildReviewScriptRequest(emptyLearnerContext())).toBeNull()
  })

  it('construye una petición con las debilidades acumuladas', () => {
    const context = {
      ...emptyLearnerContext(),
      cefr: 'B1' as const,
      strugglingWords: ['although', 'thorough', 'receipt'],
    }
    const request = buildReviewScriptRequest(context)
    expect(request).not.toBeNull()
    expect(request!.topic).toContain('repaso')
    expect(request!.srsDueWords).toContain('although')
  })

  it('exige el mínimo de debilidades', () => {
    const context = { ...emptyLearnerContext(), strugglingWords: ['one'] }
    expect(context.strugglingWords.length).toBeLessThan(MIN_WEAKNESSES_FOR_REVIEW)
    expect(buildReviewScriptRequest(context)).toBeNull()
  })
})

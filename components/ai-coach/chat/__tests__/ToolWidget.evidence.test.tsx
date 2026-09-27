// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ToolWidget from '../ToolWidget'
import type { ExerciseResult, ToolCall } from '@/lib/ai-practice/types'

vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('@/lib/learner-level/client-queries', () => ({ getEffectiveLearnerLevelForViewer: vi.fn(async () => ({ level: 'A1' })) }))
vi.mock('@/lib/ai-practice/events', () => ({ logEvent: vi.fn(async () => undefined) }))
vi.mock('../../widgets/SpeakingWidget', () => ({ default: () => null }))
vi.mock('../../widgets/WordCardWidget', () => ({ default: () => null }))

const call: ToolCall = {
  id: 'widget', name: 'render_fill_blank', status: 'rendered',
  args: { sentence: 'She ___ happy.', answer: 'is', topic: 'grammar:present simple',
    commonWrongAnswers: [{ value: 'are', category: 'incorrect_form', explanation: 'Use is.' }] },
}
afterEach(() => vi.restoreAllMocks())

describe('Coach producer evidence', () => {
  it('measures latency and carries Mostrar opciones into the answer', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
    const onAnswer = vi.fn()
    render(<ToolWidget toolCall={call} onAnswer={onAnswer} onNext={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar opciones' }))
    fireEvent.click(screen.getByRole('button', { name: /^is$/ }))
    clock.mockReturnValue(7000)
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAnswer).toHaveBeenCalledWith('widget', expect.objectContaining({
      attemptId: 'coach:widget', correct: true, latencyMs: 6000, hintsUsed: 1,
    }))
  })
  it('correction retains widget identity and the first failure', () => {
    const onAnswer = vi.fn<(id: string, result: ExerciseResult) => void>()
    render(<ToolWidget toolCall={call} onAnswer={onAnswer} onNext={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'are' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'is' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAnswer.mock.calls.map(([, result]) => result.attemptId)).toEqual(['coach:widget', 'coach:widget'])
    expect(onAnswer.mock.calls[1][1]).toMatchObject({ correct: true, firstTryFailed: true })
  })
})

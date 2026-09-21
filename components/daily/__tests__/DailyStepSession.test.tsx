// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import DailyStepSession from '../DailyStepSession'
import type { DailyStep } from '@/lib/practice/types'

const openCoach = vi.fn()

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'learner-1' } }),
}))
vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (state: { openCoach: typeof openCoach }) => unknown) => selector({ openCoach }),
}))

const missionStep: DailyStep = {
  kind: 'mission',
  id: 'mission:scripted.cafe.order:phoneme:/iː/',
  title: 'Usa el foco en una conversación',
  subtitle: 'Misión oral con un objetivo exacto',
  icon: 'Messages',
  exercises: [],
  estMinutes: 3,
  scaffolded: true,
  missionLaunch: {
    launchId: 'daily-scaffold',
    missionId: 'scripted.cafe.order',
    targetIds: [],
    source: 'daily',
    stepId: 'mission:scripted.cafe.order:phoneme:/iː/',
    scaffolded: true,
  },
}

describe('DailyStepSession', () => {
  it('abre la misión diaria adaptada en el Coach en lugar de una sesión vacía', () => {
    const onExit = vi.fn()
    render(<DailyStepSession
      step={missionStep}
      allSteps={[missionStep]}
      stepIndex={0}
      sessionKey={0}
      onComplete={vi.fn()}
      onExit={onExit}
    />)

    expect(openCoach).toHaveBeenCalledWith({ tab: 'missions', mission: missionStep.missionLaunch })
    expect(onExit).toHaveBeenCalledOnce()
  })
})

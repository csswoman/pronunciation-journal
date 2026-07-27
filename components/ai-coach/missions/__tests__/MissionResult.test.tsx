// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import MissionResult from '../MissionResult'
import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'

const outcome: MissionOutcome = {
  missionId: 'roleplay.cafe',
  goalAchieved: true,
  intelligibilityEvidence: { attempts: [], scoredCount: 1 },
  targetEvidence: [{ targetId: 'segmental.contrast.iː|ɪ' as never, outcome: 'needs_more_evidence' }],
  repairUsed: false,
  unscoredReasons: [],
}

describe('MissionResult', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY
  })

  it('always shows the structured goal result with the copy flag off', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY = 'false'
    render(<MissionResult outcome={outcome} onReviewCta={() => {}} />)

    expect(screen.getByText(/objetivo logrado/i)).toBeInTheDocument()
  })

  it('hides the pronunciation feedback when the copy flag is off', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY = 'false'
    render(<MissionResult outcome={outcome} onReviewCta={() => {}} />)

    expect(screen.queryByText(/siguiente foco/i)).not.toBeInTheDocument()
  })

  it('shows the feedback target when the copy flag is on', () => {
    render(<MissionResult outcome={outcome} onReviewCta={() => {}} />)

    expect(screen.getByText(/siguiente foco/i)).toBeInTheDocument()
  })
})

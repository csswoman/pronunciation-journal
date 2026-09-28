// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewChunkInvitation from '../NewChunkInvitation'

vi.mock('@/lib/learner-level/client-queries', () => ({
  getEffectiveLearnerLevel: vi.fn(async () => ({ level: 'A1' })),
}))
vi.mock('@/lib/chunk-of-day/queries', () => ({
  loadDailyChunkIntroStep: vi.fn(async () => ({
    chunks: [{ id: 'chunk-1', chunk: 'Could you help me?', meaning: '¿Podrías ayudarme?' }],
  })),
}))

describe('NewChunkInvitation', () => {
  it('opens focused practice for the exact expression shown', async () => {
    render(<NewChunkInvitation userId="learner" />)
    expect(await screen.findByText('Could you help me?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aprender esta expresión' }))
      .toHaveAttribute('href', '/practice/chunks?chunk=chunk-1')
  })
})

// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/practice',
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

vi.mock('@/lib/word-bank/queries', () => ({
  countWordsDueForReviewClient: vi.fn(async () => 5),
}))

vi.mock('@/lib/db', () => ({
  getLastPracticeMode: vi.fn(async () => null),
  setLastPracticeMode: vi.fn(),
}))

vi.mock('@/components/ai-coach/SpeakWithCoachCard', () => ({
  default: () => <div data-testid="speak-with-coach">SpeakWithCoach</div>,
}))

import PracticeHubClient from '../PracticeHubClient'

describe('PracticeHubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prioritizes due review while keeping every actionable practice visible', async () => {
    render(<PracticeHubClient fromDaily={false} />)

    await waitFor(() => {
      expect(screen.getByText('Tienes 5 palabras pendientes de repaso')).toBeInTheDocument()
    })

    expect(screen.getByText('Vocabulario')).toBeInTheDocument()
    expect(screen.getByText('Pronunciación')).toBeInTheDocument()
    expect(screen.getByText('Contexto y lectura')).toBeInTheDocument()
    expect(screen.queryByText('Juegos')).not.toBeInTheDocument()

    expect(screen.getByText('Palabras esenciales')).toBeInTheDocument()
    expect(screen.getByText('Tus mazos')).toBeInTheDocument()
    expect(screen.getByText('Repaso')).toBeInTheDocument()
    expect(screen.getByText('Laboratorio de sonidos')).toBeInTheDocument()
    expect(screen.getByText('Habla conectada')).toBeInTheDocument()
    expect(screen.getByText('Entonación')).toBeInTheDocument()
    expect(screen.getByText('Lectura en contexto')).toBeInTheDocument()
    expect(screen.getByText('Ruta guiada')).toBeInTheDocument()
    expect(screen.getByTestId('speak-with-coach')).toBeInTheDocument()
  })
})

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

    // "Vocabulario" appears both as the hero SRS card's kicker and as the
    // VocabularySection lane title — both doors are expected to coexist.
    expect(screen.getAllByText('Vocabulario').length).toBeGreaterThan(0)
    // Same for "Pronunciación": hero kicker + PronunciationSection lane title.
    expect(screen.getAllByText('Pronunciación').length).toBeGreaterThan(0)
    // B5: the four practice doors, all present now that games has a door too.
    expect(screen.getByText('Juegos')).toBeInTheDocument()
    expect(screen.getByText('Consulta')).toBeInTheDocument()

    // "Palabras esenciales" and "Laboratorio de sonidos" each appear twice:
    // once as the hero card's own title, once as a door card's title in the
    // corresponding *Section lane below. Both placements are intentional.
    expect(screen.getAllByText('Palabras esenciales').length).toBeGreaterThan(0)
    expect(screen.getByText('Tus mazos')).toBeInTheDocument()
    expect(screen.getByText('Empezar repaso')).toBeInTheDocument()
    expect(screen.getAllByText('Laboratorio de sonidos').length).toBeGreaterThan(0)
    expect(screen.getByText('Habla conectada')).toBeInTheDocument()
    expect(screen.getByText('Entonación')).toBeInTheDocument()
    expect(screen.getByText('Pares mínimos')).toBeInTheDocument()
    expect(screen.getByText('Lectura en contexto')).toBeInTheDocument()
    expect(screen.getByText('Ruta guiada')).toBeInTheDocument()
    expect(screen.getByText('Diccionario')).toBeInTheDocument()
    expect(screen.getByTestId('speak-with-coach')).toBeInTheDocument()
  })
})

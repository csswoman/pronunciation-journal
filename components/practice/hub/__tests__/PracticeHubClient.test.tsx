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

vi.mock('@/lib/essential-words/level-count', () => ({
  getEssentialWordsLevelCount: vi.fn(async () => ({ learned: 0, total: 1000 })),
}))

vi.mock('@/lib/essential-words/target-level', () => ({
  readStoredCefrLevel: vi.fn(async () => 'A1'),
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
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText(/palabras esperan repaso/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Las 1000 esenciales')).toBeInTheDocument()
    expect(screen.getByText('Tus mazos')).toBeInTheDocument()
    expect(screen.getByText('Empezar repaso')).toBeInTheDocument()
    expect(screen.getByText('Laboratorio de sonidos')).toBeInTheDocument()
    expect(screen.getByText('Habla conectada')).toBeInTheDocument()
    expect(screen.getByText('Entonación')).toBeInTheDocument()
    expect(screen.getByText('Pares mínimos')).toBeInTheDocument()
    expect(screen.getByText('Inmersión y conversación')).toBeInTheDocument()
    expect(screen.getByText('Lectura en contexto')).toBeInTheDocument()
    expect(screen.getByText('Ruta guiada')).toBeInTheDocument()
    expect(screen.getByText('Juegos de vocabulario')).toBeInTheDocument()
    expect(screen.getByText('Diccionario')).toBeInTheDocument()
    expect(screen.getByTestId('speak-with-coach')).toBeInTheDocument()
  })
})

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PracticeGamesHubClient from '../PracticeGamesHubClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/lib/practice/last-practice-mode', () => ({
  setLastPracticeMode: vi.fn(),
}))

vi.mock('@/hooks/useWordSearchSetup', () => ({
  useWordSearchSetup: () => ({
    mode: 'classic',
    setMode: vi.fn(),
    source: 'dictionary',
    setSource: vi.fn(),
    selectedDictId: 'frontend-dev',
    setSelectedDictId: vi.fn(),
    selectedPresetId: 'vowels',
    setSelectedPresetId: vi.fn(),
    customTopic: '',
    setCustomTopic: vi.fn(),
    customLevel: 'A2',
    setCustomLevel: vi.fn(),
    myWords: [],
    isLoadingWords: false,
    isLoadingDict: false,
    isGeneratingAi: false,
    aiError: null,
    errors: {},
    dictError: null,
    curatedError: null,
    wordBankError: null,
    handleStartDictionary: vi.fn(),
    handleStartCurated: vi.fn(),
    handleStartMyWords: vi.fn(),
    handleStartGemini: vi.fn(),
  }),
}))

describe('PracticeGamesHubClient', () => {
  it('renders header, available games, and upcoming games sidebar', () => {
    render(<PracticeGamesHubClient />)

    expect(screen.getByRole('heading', { name: 'Juegos', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Mecánicas cortas para ganar reflejos con el vocabulario que ya tienes.')).toBeInTheDocument()
    expect(screen.getByText('DISPONIBLES')).toBeInTheDocument()
    expect(screen.getByText('EN CAMINO')).toBeInTheDocument()
    expect(screen.getByText('Cadena de sonidos')).toBeInTheDocument()
    expect(screen.getByText('Duelo de frases')).toBeInTheDocument()
    expect(screen.getByText('Invasores de fonemas')).toBeInTheDocument()
  })

  it('switches active game view when sidebar item is clicked', () => {
    render(<PracticeGamesHubClient />)

    // Initially Sopa de letras is selected
    expect(screen.getByRole('heading', { name: 'Sopa de letras', level: 2 })).toBeInTheDocument()

    // Click Lluvia de palabras
    const wordRainBtn = screen.getByRole('button', { name: /Lluvia de palabras/i })
    fireEvent.click(wordRainBtn)

    expect(screen.getByRole('heading', { name: 'Lluvia de palabras', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('PRÁCTICA DE MECANOGRAFÍA')).toBeInTheDocument()
  })
})

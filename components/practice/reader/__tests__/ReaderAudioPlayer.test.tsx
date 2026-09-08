// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReaderAudioPlayer } from '../ReaderAudioPlayer'
import { fetchReaderAudioUrl } from '@/lib/practice/reader/queries'

vi.mock('@/lib/practice/reader/queries', () => ({
  fetchReaderAudioUrl: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  updateReaderPassageAudioUrl: vi.fn(async () => {}),
}))

describe('ReaderAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.HTMLMediaElement.prototype.play = vi.fn(async () => {})
    window.HTMLMediaElement.prototype.pause = vi.fn()
  })

  it('renders generation prompt when initialAudioUrl is not present', () => {
    render(
      <ReaderAudioPlayer
        passageId="p-1"
        passageText="A morning coffee in Seattle."
        online={true}
      />
    )

    expect(screen.getByText('Voz nativa de alta fidelidad')).toBeInTheDocument()
    expect(screen.getByText('Generar voz HD 🎙️')).toBeInTheDocument()
  })

  it('renders audio controls when initialAudioUrl is provided', () => {
    render(
      <ReaderAudioPlayer
        passageId="p-1"
        passageText="A morning coffee in Seattle."
        initialAudioUrl="https://example.com/audio.wav"
        online={true}
      />
    )

    expect(screen.getByText('Voz HD lista (Puck)')).toBeInTheDocument()
    expect(screen.getByLabelText('Reproducir audio')).toBeInTheDocument()
    expect(screen.getByText('1x')).toBeInTheDocument()
  })

  it('calls fetchReaderAudioUrl when user clicks generate and updates player', async () => {
    vi.mocked(fetchReaderAudioUrl).mockResolvedValueOnce('https://example.com/generated.wav')

    render(
      <ReaderAudioPlayer
        passageId="p-1"
        passageText="A morning coffee in Seattle."
        online={true}
      />
    )

    const btn = screen.getByText('Generar voz HD 🎙️')
    fireEvent.click(btn)

    await waitFor(() => {
      expect(fetchReaderAudioUrl).toHaveBeenCalledWith('p-1', 'A morning coffee in Seattle.')
    })

    await waitFor(() => {
      expect(screen.getByText('Voz HD lista (Puck)')).toBeInTheDocument()
    })
  })
})

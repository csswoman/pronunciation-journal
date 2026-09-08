// components/pronunciation-feedback/__tests__/ListenPanel.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ListenPanel } from '../ListenPanel'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...a) }))

describe('ListenPanel', () => {
  const pairs = [{ wordA: 'zoo', wordB: 'sue' }, { wordA: 'zip', wordB: 'sip' }]

  it('renders minimal-pair chips and speaks the word on click', () => {
    render(<ListenPanel minimalPairs={pairs} targetText="goes" userAudioUrl={null} />)
    const chip = screen.getByRole('button', { name: 'zoo' })
    fireEvent.click(chip)
    expect(speak).toHaveBeenCalledWith('zoo')
  })

  it('renders Nativo and Mi voz buttons', () => {
    render(<ListenPanel minimalPairs={pairs} targetText="goes" userAudioUrl={null} />)
    expect(screen.getByRole('button', { name: /escuchar modelo nativo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar mi propia voz/i })).toBeInTheDocument()
  })

  it('disables Mi voz without a user audio url', () => {
    render(<ListenPanel minimalPairs={pairs} targetText="goes" userAudioUrl={null} />)
    expect(screen.getByRole('button', { name: /escuchar mi propia voz/i })).toBeDisabled()
  })

  it('omits the chips row when there are no minimal pairs', () => {
    render(<ListenPanel minimalPairs={[]} targetText="goes" userAudioUrl={null} />)
    expect(screen.queryByText(/escucha la diferencia/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar modelo nativo/i })).toBeInTheDocument()
  })
})

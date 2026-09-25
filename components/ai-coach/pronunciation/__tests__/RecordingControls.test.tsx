// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RecordingControls from '@/components/ai-coach/pronunciation/RecordingControls'
import { AI_TRANSCRIPTION_TIMEOUT_MESSAGE } from '@/lib/degradation/messages'

describe('RecordingControls', () => {
  it('shows a no-speech error and allows another attempt', () => {
    const onMicClick = vi.fn()
    render(
      <RecordingControls
        isRecording={false}
        isAnalyzing={false}
        error="no-speech"
        isSupported
        onMicClick={onMicClick}
        onSkip={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No detectamos tu voz')
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar grabación' }))
    expect(onMicClick).toHaveBeenCalledOnce()
  })

  it('disables recording when microphone capture is unsupported', () => {
    render(
      <RecordingControls
        isRecording={false}
        isAnalyzing={false}
        isSupported={false}
        onMicClick={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('no permite usar el micrófono')
    expect(screen.getByRole('button', { name: 'Iniciar grabación' })).toBeDisabled()
  })

  it('explains a transcription timeout instead of showing the generic failure', () => {
    render(
      <RecordingControls
        isRecording={false}
        isAnalyzing={false}
        error={AI_TRANSCRIPTION_TIMEOUT_MESSAGE}
        isSupported
        onMicClick={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('La transcripción tardó demasiado')
  })
})

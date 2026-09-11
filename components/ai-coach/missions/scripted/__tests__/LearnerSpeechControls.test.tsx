// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LearnerSpeechControls } from '../LearnerSpeechControls'

describe('LearnerSpeechControls', () => {
  const dummySamples = () => new Uint8Array(200).fill(128)

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      strokeStyle: '',
      lineWidth: 2,
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  it('renders Hablar button when idle and calls onStart', () => {
    const onStart = vi.fn()
    render(
      <LearnerSpeechControls
        status="idle"
        isCapturing={false}
        isScoring={false}
        errorCode={null}
        getSamples={dummySamples}
        canScore={true}
        onStart={onStart}
        onStop={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    const btn = screen.getByRole('button', { name: /hablar/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('renders real waveform canvas and Detener button when listening', () => {
    const onStop = vi.fn()
    const { container } = render(
      <LearnerSpeechControls
        status="listening"
        isCapturing={true}
        isScoring={false}
        errorCode={null}
        getSamples={dummySamples}
        canScore={true}
        onStart={vi.fn()}
        onStop={onStop}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByTestId('recording-indicator')).toBeInTheDocument()
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()

    const stopBtn = screen.getByRole('button', { name: /detener/i })
    expect(stopBtn).toBeInTheDocument()
    fireEvent.click(stopBtn)
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('renders evaluating status when isScoring or status is processing', () => {
    render(
      <LearnerSpeechControls
        status="processing"
        isCapturing={false}
        isScoring={false}
        errorCode={null}
        getSamples={dummySamples}
        canScore={true}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText(/analizando pronunciación/i)).toBeInTheDocument()
  })

  it('renders error message and retry button when status is error', () => {
    const onRetry = vi.fn()
    render(
      <LearnerSpeechControls
        status="error"
        isCapturing={false}
        isScoring={false}
        errorCode="not-allowed"
        getSamples={dummySamples}
        canScore={true}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText(/permiso de micrófono denegado/i)).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /reintentar/i })
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('muestra aviso de modo práctica cuando canScore es false y status es idle', () => {
    render(
      <LearnerSpeechControls
        status="idle"
        isCapturing={false}
        isScoring={false}
        errorCode={null}
        getSamples={dummySamples}
        canScore={false}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    expect(
      screen.getByText(/sin conexión para evaluar: practica y compara tu voz/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hablar/i })).toBeInTheDocument()
  })

  it('no muestra el indicador de grabación si el micro aún no captura', () => {
    render(
      <LearnerSpeechControls
        status="listening"
        isCapturing={false}
        isScoring={false}
        errorCode={null}
        getSamples={dummySamples}
        canScore={true}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument()
    // Aun así debe poder detenerse: el reconocedor sigue vivo.
    expect(screen.getByRole('button', { name: /detener/i })).toBeInTheDocument()
  })
})

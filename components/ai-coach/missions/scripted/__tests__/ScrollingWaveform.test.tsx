// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ScrollingWaveform } from '../ScrollingWaveform'

describe('ScrollingWaveform', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Mock HTMLCanvasElement getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 2,
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('renderiza canvas cuando isActive es true y no hay reduced-motion', () => {
    const getSamples = () => new Uint8Array(200).fill(128)
    const { container } = render(<ScrollingWaveform getSamples={getSamples} isActive={true} />)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })

  it('renderiza barra de nivel accesible y no llama rAF bajo prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    const getSamples = () => new Uint8Array(200).fill(128)

    const { container } = render(
      <ScrollingWaveform getSamples={getSamples} peak={0.75} isActive={true} />,
    )

    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    const levelBar = container.querySelector('[data-testid="reduced-motion-level-bar"]')
    expect(levelBar).toBeInTheDocument()
    expect(rafSpy).not.toHaveBeenCalled()
  })
})

// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScriptedResult } from '../ScriptedResult'
import { SCRIPTED_MISSIONS } from '@/lib/ai-practice/missions/scripted/catalog'

vi.mock('@/lib/illustrations/registry', () => ({
  getIllustration: () => (props: Record<string, unknown>) =>
    <svg data-testid="illustration" {...props} />,
}))

const mission = SCRIPTED_MISSIONS[0]
const score = { score: 100, scoredLines: 3, correctPhonemes: 30, totalPhonemes: 30 }

describe('ScriptedResult', () => {
  it('ofrece salir de la mision', () => {
    const onExit = vi.fn()
    render(<ScriptedResult mission={mission} sessionScore={score} onExit={onExit} onRetry={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /volver|misiones/i }))
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('ofrece repetir el guion', () => {
    const onRetry = vi.fn()
    render(<ScriptedResult mission={mission} sessionScore={score} onExit={vi.fn()} onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /repetir|otra vez/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('celebra un buen resultado con ilustracion', () => {
    render(<ScriptedResult mission={mission} sessionScore={score} onExit={vi.fn()} onRetry={vi.fn()} />)

    expect(screen.getByTestId('illustration')).toBeInTheDocument()
    expect(screen.getByText('100%').closest('div')?.className).toContain('success-pulse')
  })

  it('no celebra una puntuacion baja, pero sigue dando salida', () => {
    render(<ScriptedResult
      mission={mission}
      sessionScore={{ ...score, score: 40 }}
      onExit={vi.fn()}
      onRetry={vi.fn()}
    />)

    expect(screen.getByText('40%').closest('div')?.className).not.toContain('success-pulse')
    expect(screen.getByRole('button', { name: /volver|misiones/i })).toBeInTheDocument()
  })

  it('sigue permitiendo salir cuando no se pudo evaluar', () => {
    render(<ScriptedResult
      mission={mission}
      sessionScore={{ score: null, scoredLines: 0, correctPhonemes: 0, totalPhonemes: 0 }}
      onExit={vi.fn()}
      onRetry={vi.fn()}
    />)

    expect(screen.getByRole('button', { name: /volver|misiones/i })).toBeInTheDocument()
  })
})

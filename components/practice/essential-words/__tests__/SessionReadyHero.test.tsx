// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionReadyHero } from '../SessionReadyHero'

const heroProps = {
  preview: {
    actionBudget: 15,
    scheduledActions: 15,
    uniqueWords: 5,
    newWordCount: 3,
    reviewActionCount: 4,
    continuationActionCount: 0,
    estimatedDurationMs: 168_000,
    completedActions: 0,
    remainingActions: 15,
  },
  isResume: false,
  activeRouteId: null as string | null,
  onRouteChange: vi.fn(),
  sessionSize: 'recommended' as const,
  onSessionSizeChange: vi.fn(),
  onBegin: vi.fn(),
  onDiscard: vi.fn(),
  previewLoading: false,
}

describe('SessionReadyHero', () => {
  it('shows the commitment headline, breakdown, size picker, route chips, and start CTA', () => {
    render(<SessionReadyHero {...heroProps} />)

    expect(screen.getByRole('heading', { name: 'Hoy tienes 15 ejercicios' })).toBeInTheDocument()
    expect(screen.getByText(/unos \d+ min/)).toBeInTheDocument()
    expect(screen.getByText('3 palabras nuevas · 4 repasos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recomendada · 15' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Ruta')).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Por frecuencia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeInTheDocument()
  })

  it('uses review-only copy with final round when there are no new words', () => {
    render(
      <SessionReadyHero
        {...heroProps}
        preview={{ ...heroProps.preview, newWordCount: 0, reviewActionCount: 5 }}
      />,
    )
    expect(screen.getByText('5 repasos')).toBeInTheDocument()
  })

  it('switches to resume copy when learning cards remain', () => {
    render(
      <SessionReadyHero
        {...heroProps}
        preview={{ ...heroProps.preview, completedActions: 6, remainingActions: 9, continuationActionCount: 3 }}
        isResume
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Continuar donde lo dejaste' }),
    ).toBeInTheDocument()
    expect(screen.getByText('9 ejercicios pendientes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descartar sesión' })).toBeInTheDocument()
  })

  it('calls onBegin when Empezar is pressed', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(<SessionReadyHero {...heroProps} onBegin={onBegin} />)
    await user.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(onBegin).toHaveBeenCalledOnce()
  })

  it('calls onSessionSizeChange when a size chip is pressed', async () => {
    const user = userEvent.setup()
    const onSessionSizeChange = vi.fn()
    render(<SessionReadyHero {...heroProps} onSessionSizeChange={onSessionSizeChange} />)
    await user.click(screen.getByRole('button', { name: 'Larga · 25' }))
    expect(onSessionSizeChange).toHaveBeenCalledWith('long')
  })

  it('uses the frequency route and lets the learner choose a focused route', async () => {
    const user = userEvent.setup()
    const onRouteChange = vi.fn()
    render(<SessionReadyHero {...heroProps} activeRouteId="verbs-b1" onRouteChange={onRouteChange} />)

    const routePicker = screen.getByLabelText('Ruta')
    await user.selectOptions(routePicker, '')
    expect(onRouteChange).toHaveBeenCalledWith(null)

    await user.selectOptions(routePicker, 'nouns-b2')
    expect(onRouteChange).toHaveBeenLastCalledWith('nouns-b2')
  })

  it('keeps the hero mounted and disables start while rebuilding the preview', () => {
    render(<SessionReadyHero {...heroProps} previewLoading />)

    expect(screen.getByRole('heading', { name: 'Hoy tienes 15 ejercicios' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Actualizando sesión')
    expect(screen.getByRole('button', { name: 'Actualizando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Corta · 5' })).toBeEnabled()
    expect(screen.getByLabelText('Ruta')).toBeEnabled()
  })

  it('freezes route and size but lets the learner discard a resumed session', async () => {
    const user = userEvent.setup()
    const onDiscard = vi.fn()
    render(<SessionReadyHero {...heroProps} isResume onDiscard={onDiscard} />)

    expect(screen.getByRole('button', { name: 'Corta · 5' })).toBeDisabled()
    expect(screen.getByLabelText('Ruta')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Descartar sesión' }))
    expect(onDiscard).toHaveBeenCalledOnce()
  })
})

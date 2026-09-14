// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

import { Phase1PerceptionCard } from '../Phase1PerceptionCard'
import { ED_DRILL_CATALOG } from '@/lib/pronunciation/ed-drills/catalog'

describe('Phase1PerceptionCard', () => {
  it('vela las opciones hasta que la persona interactúa y las revela después', () => {
    render(<Phase1PerceptionCard item={ED_DRILL_CATALOG[0]} onComplete={vi.fn()} />)

    expect(screen.getByTestId('perception-options')).toHaveClass('blur-sm')

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar opción de pasado' }))

    expect(screen.getByTestId('perception-options')).not.toHaveClass('blur-sm')
    expect(screen.getByText('I achieved it.')).toBeVisible()
  })

  it('marca acierto al elegir la opción de pasado para el audio pasado', () => {
    const onComplete = vi.fn()
    render(<Phase1PerceptionCard item={ED_DRILL_CATALOG[0]} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar opción de pasado' }))

    expect(onComplete).toHaveBeenCalledWith(true)
    expect(screen.getByText('¡Exacto! Escuchaste el pasado.')).toBeInTheDocument()
  })
})

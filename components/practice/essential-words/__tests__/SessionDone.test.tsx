// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionDone } from '../SessionDone'
import type { EssentialWordsStats, EssentialWordsSessionSummary } from '@/hooks/useEssentialWordsSession'

vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))

const stats: EssentialWordsStats = {
  totalWords: 500,
  learned: 120,
  dueCount: 7,
  dueTomorrow: 0,
  newToday: 5,
  newQuota: 9,
  vaulted: 3,
}

const sessionSummary: EssentialWordsSessionSummary = {
  practiced: 18,
  correct: 15,
}

const strugglingWords = ['apple', 'banana', 'cherry']

describe('SessionDone', () => {
  it('renders a StatBlock with Aprendidas hoy / Repasadas / Sin fallos computed from stats + summary + struggling words', () => {
    render(
      <SessionDone stats={stats} sessionSummary={sessionSummary} strugglingWords={strugglingWords} />,
    )

    expect(screen.getByText('Aprendidas hoy')).toBeTruthy()
    expect(screen.getByText('Repasadas')).toBeTruthy()
    expect(screen.getByText('Sin fallos')).toBeTruthy()

    // newToday = 5
    expect(screen.getByText('5')).toBeTruthy()
    // practiced(18) - newToday(5) = 13
    expect(screen.getByText('13')).toBeTruthy()
    // practiced(18) - strugglingWords.length(3) = 15
    expect(screen.getByText('15')).toBeTruthy()
  })

  it('renders one chip per struggling word with the heading text', () => {
    render(
      <SessionDone stats={stats} sessionSummary={sessionSummary} strugglingWords={strugglingWords} />,
    )

    expect(screen.getByText('Estas te costaron — vuelven mañana')).toBeTruthy()
    for (const word of strugglingWords) {
      expect(screen.getByText(word)).toBeTruthy()
    }
  })

  it('omits the chip list section when strugglingWords is empty or omitted', () => {
    const { rerender } = render(
      <SessionDone stats={stats} sessionSummary={sessionSummary} strugglingWords={[]} />,
    )
    expect(screen.queryByText('Estas te costaron — vuelven mañana')).toBeNull()

    rerender(<SessionDone stats={stats} sessionSummary={sessionSummary} />)
    expect(screen.queryByText('Estas te costaron — vuelven mañana')).toBeNull()
  })

  it('explains that another session uses the selected action size', () => {
    render(
      <SessionDone stats={stats} sessionSummary={sessionSummary} strugglingWords={strugglingWords} />,
    )

    expect(screen.getByText('La próxima sesión se armará con el tamaño seleccionado.')).toBeTruthy()
  })

  it('does not render StatBlock, chips, or tomorrow preview in the wasEmpty variant', () => {
    render(
      <SessionDone
        stats={stats}
        sessionSummary={sessionSummary}
        strugglingWords={strugglingWords}
        wasEmpty
      />,
    )

    expect(screen.getByText('Nada pendiente por hoy')).toBeTruthy()
    expect(screen.getByText('Estás al día. Vuelve mañana, el repaso espaciado hace el resto.')).toBeTruthy()
    expect(screen.queryByText('Aprendidas hoy')).toBeNull()
    expect(screen.queryByText('Repasadas')).toBeNull()
    expect(screen.queryByText('Sin fallos')).toBeNull()
    expect(screen.queryByText('Estas te costaron — vuelven mañana')).toBeNull()
    expect(screen.queryByText(/^Próxima sesión:/)).toBeNull()
  })

  it('shows "Ver progreso" and "Abrir plan de hoy" directly, without needing to expand anything', () => {
    render(
      <SessionDone stats={stats} sessionSummary={sessionSummary} strugglingWords={strugglingWords} />,
    )

    expect(screen.getByRole('link', { name: 'Ver progreso' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Abrir plan de hoy' })).toBeVisible()
  })

  it('makes "Practicar otra sesión" the primary action when both CTAs are present', () => {
    render(
      <SessionDone
        stats={stats}
        sessionSummary={sessionSummary}
        strugglingWords={strugglingWords}
        onLearnMore={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Practicar otra sesión' }).className).toContain('bg-primary')
    expect(screen.getByRole('button', { name: 'Buscar palabras para practicar' }).className).not.toContain('bg-primary')
  })

  it('does not render StatBlock, chips, or tomorrow preview in the loadFailed variant', () => {
    render(
      <SessionDone
        stats={stats}
        sessionSummary={sessionSummary}
        strugglingWords={strugglingWords}
        loadFailed
      />,
    )

    expect(screen.getByText('No se pudo cargar la sesión')).toBeTruthy()
    expect(screen.getByText('Revisa tu conexión o vuelve a intentar la carga.')).toBeTruthy()
    expect(screen.queryByText('Aprendidas hoy')).toBeNull()
    expect(screen.queryByText('Repasadas')).toBeNull()
    expect(screen.queryByText('Sin fallos')).toBeNull()
    expect(screen.queryByText('Estas te costaron — vuelven mañana')).toBeNull()
    expect(screen.queryByText(/^Próxima sesión:/)).toBeNull()
  })
})

// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EssentialWordsPageHeader } from '../EssentialWordsPageHeader'

const baseStats = {
  totalWords: 200,
  learned: 12,
  dueCount: 3,
  newToday: 0,
  newQuota: 10,
  vaulted: 2,
}

describe('EssentialWordsPageHeader', () => {
  it('renders the page title without session controls', () => {
    render(
      <EssentialWordsPageHeader
        phase="ready"
        stats={baseStats}
        speaking={false}
        onExit={vi.fn()}
      />,
    )

    expect(screen.getByText('Práctica')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Palabras esenciales' })).toBeInTheDocument()
    expect(screen.queryByText('12 de 200 palabras en curso')).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Ruta de práctica' })).toBeNull()
  })

  it('shows only the exit control while speaking', () => {
    render(
      <EssentialWordsPageHeader
        phase="speak"
        stats={baseStats}
        speaking
        onExit={vi.fn()}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Palabras esenciales' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Salir de la práctica' })).toBeInTheDocument()
  })
})

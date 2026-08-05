// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatBlock } from '../StatBlock'

describe('StatBlock', () => {
  it('renders one column per stat with its label and value', () => {
    render(
      <StatBlock
        stats={[
          { label: 'Nuevas', value: 8 },
          { label: 'Repasos', value: 16 },
          { label: 'En el baúl', value: 8 },
        ]}
      />,
    )

    expect(screen.getAllByText('8')).toHaveLength(2)
    expect(screen.getByText('16')).toBeTruthy()
    expect(screen.getByText('Nuevas')).toBeTruthy()
    expect(screen.getByText('Repasos')).toBeTruthy()
    expect(screen.getByText('En el baúl')).toBeTruthy()
  })

  it('supports an accented column for emphasis', () => {
    render(
      <StatBlock
        stats={[
          { label: 'Aprendidas hoy', value: 8, accent: true },
          { label: 'Repasadas', value: 16 },
        ]}
      />,
    )

    expect(screen.getByText('8').className).toContain('text-info')
  })
})

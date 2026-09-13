// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectMenu } from '../SelectMenu'

describe('SelectMenu', () => {
  const sampleOptions = [
    { value: 'opt1', label: 'Opción 1', description: 'Primera opción' },
    { value: 'opt2', label: 'Opción 2', description: 'Segunda opción' },
    { value: 'opt3', label: 'Opción 3', disabled: true },
  ]

  const sampleGroups = [
    {
      label: 'Nivel A1',
      options: [
        { value: 'a1-1', label: 'Básico A1', description: 'Primeros pasos' },
      ],
    },
    {
      label: 'Nivel B1',
      options: [
        { value: 'b1-1', label: 'Intermedio B1', description: 'Uso fluido' },
      ],
    },
  ]

  it('renders with selected option label', () => {
    render(<SelectMenu value="opt2" onChange={vi.fn()} options={sampleOptions} label="Mi Selector" />)
    expect(screen.getByRole('combobox', { name: 'Mi Selector' })).toHaveTextContent('Opción 2')
  })

  it('opens options and selects an item', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SelectMenu value="opt1" onChange={onChange} options={sampleOptions} aria-label="Ruta" />)

    const trigger = screen.getByRole('combobox', { name: 'Ruta' })
    await user.click(trigger)

    const option2Buttons = screen.getAllByRole('option', { name: /Opción 2/ })
    expect(option2Buttons.length).toBeGreaterThan(0)
    await user.click(option2Buttons[0])

    expect(onChange).toHaveBeenCalledWith('opt2')
  })

  it('supports grouped options', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SelectMenu value="a1-1" onChange={onChange} groups={sampleGroups} aria-label="Nivel" />)

    const trigger = screen.getByRole('combobox', { name: 'Nivel' })
    await user.click(trigger)

    expect(screen.getAllByText('Nivel A1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nivel B1').length).toBeGreaterThan(0)

    const optionB1 = screen.getAllByRole('option', { name: /Intermedio B1/ })
    await user.click(optionB1[0])

    expect(onChange).toHaveBeenCalledWith('b1-1')
  })

  it('closes on Escape key press', async () => {
    const user = userEvent.setup()
    render(<SelectMenu value="opt1" onChange={vi.fn()} options={sampleOptions} aria-label="Menu" />)

    const trigger = screen.getByRole('combobox', { name: 'Menu' })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

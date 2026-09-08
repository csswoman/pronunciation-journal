// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateStoryModal } from '../CreateStoryModal'

describe('CreateStoryModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <CreateStoryModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isGenerating={false}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal elements and defaults to initialLevel', () => {
    render(
      <CreateStoryModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isGenerating={false}
        initialLevel="A2"
        targetWordsPreview={['water', 'friend']}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Crear nueva historia')).toBeInTheDocument()
    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('friend')).toBeInTheDocument()
  })

  it('allows clicking suggested topic chips to fill topic input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <CreateStoryModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isGenerating={false}
        initialLevel="B1"
      />
    )

    const techChip = screen.getByRole('button', { name: /Tecnología/i })
    await user.click(techChip)

    const input = screen.getByLabelText(/¿De qué tema quieres la historia\?/i) as HTMLInputElement
    expect(input.value).toBe('Innovación tecnológica y el futuro')

    await user.click(screen.getByRole('button', { name: /Crear historia/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      topic: 'Innovación tecnológica y el futuro',
      level: 'B1',
    })
  })

  it('submits typed custom topic and selected level', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <CreateStoryModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isGenerating={false}
        initialLevel="B1"
      />
    )

    // Select B2
    await user.click(screen.getByRole('button', { name: /B2/i }))

    // Type topic
    const input = screen.getByLabelText(/¿De qué tema quieres la historia\?/i)
    await user.type(input, 'Aventura en la selva')

    await user.click(screen.getByRole('button', { name: /Crear historia/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      topic: 'Aventura en la selva',
      level: 'B2',
    })
  })

  it('displays error banner if onSubmit throws', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Fallo en la conexión'))

    render(
      <CreateStoryModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isGenerating={false}
      />
    )

    await user.click(screen.getByRole('button', { name: /Crear historia/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo en la conexión')
  })
})

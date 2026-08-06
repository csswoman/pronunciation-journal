// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecognizeOptionGrid } from '../RecognizeOptionGrid'

describe('RecognizeOptionGrid', () => {
  it('does not fire keyboard shortcuts while a text input is focused', () => {
    const onChoose = vi.fn()
    render(
      <>
        <input aria-label="respuesta" />
        <RecognizeOptionGrid
          options={['through', 'under', 'over', 'into']}
          chosen={null}
          correctWord="through"
          onChoose={onChoose}
        />
      </>,
    )

    const input = screen.getByLabelText('respuesta')
    input.focus()
    fireEvent.keyDown(input, { key: '1' })
    expect(onChoose).not.toHaveBeenCalled()
  })
})

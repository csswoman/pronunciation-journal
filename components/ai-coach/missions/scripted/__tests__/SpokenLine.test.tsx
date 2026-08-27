// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SpokenLine } from '../SpokenLine'

describe('SpokenLine', () => {
  it('marca solo la palabra en curso', () => {
    render(<SpokenLine text="Hello how are you" activeIndex={2} />)
    expect(screen.getByText('are')).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('how')).toHaveAttribute('data-active', 'false')
  })

  it('no marca ninguna palabra cuando no hay indice activo', () => {
    render(<SpokenLine text="Hello how are you" activeIndex={null} />)
    for (const word of ['Hello', 'how', 'are', 'you']) {
      expect(screen.getByText(word)).toHaveAttribute('data-active', 'false')
    }
  })

  it('ignora un indice fuera de rango sin romperse', () => {
    render(<SpokenLine text="Hello how" activeIndex={99} />)
    expect(screen.getByText('Hello')).toHaveAttribute('data-active', 'false')
    expect(screen.getByText('how')).toHaveAttribute('data-active', 'false')
  })

  it('el texto completo sigue siendo legible como una frase', () => {
    render(<SpokenLine text="Hello how are you" activeIndex={1} />)
    expect(screen.getByTestId('spoken-script-line')).toHaveTextContent('Hello how are you')
  })
})

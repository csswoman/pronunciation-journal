// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoachLine } from '../CoachLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...args: unknown[]) => speak(...args) }))

const line: ScriptLine = { id: 'l1', speaker: 'coach', text: 'How are you?' }

describe('CoachLine', () => {
  beforeEach(() => speak.mockClear())

  it('muestra el texto de la línea', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(screen.getByText('How are you?')).toBeInTheDocument()
  })

  it('reproduce la línea al pulsar escuchar', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))
    expect(speak).toHaveBeenCalled()
  })

  it('avanza al pulsar continuar', () => {
    const onContinue = vi.fn()
    render(<CoachLine line={line} onContinue={onContinue} />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})

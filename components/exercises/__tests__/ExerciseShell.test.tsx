// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseShell } from '../ExerciseShell'

describe('ExerciseShell', () => {
  const baseProps = {
    title: 'Listen and type the sentence',
    result: null,
    onContinue: vi.fn(),
    onSkip: vi.fn(),
    children: <div>exercise content</div>,
  }

  it('renders title eyebrow', () => {
    render(<ExerciseShell {...baseProps} />)
    expect(screen.getByText('Listen and type the sentence')).toBeInTheDocument()
  })

  it('renders hint chip when hint provided', () => {
    render(
      <ExerciseShell {...baseProps} hint={{ word: 'idyllic', meaning: 'pleasantly peaceful' }} />
    )
    expect(screen.getByText('idyllic')).toBeInTheDocument()
    expect(screen.getByText('pleasantly peaceful')).toBeInTheDocument()
  })

  it('shows Skip while idle (result null)', () => {
    render(<ExerciseShell {...baseProps} />)
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('shows Continue and hides Skip when result is set', () => {
    render(
      <ExerciseShell
        {...baseProps}
        result={{ isCorrect: true, userAnswer: 'hello', timeMs: 1000 }}
      />
    )
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })

  it('calls onSkip when Skip is clicked', () => {
    const onSkip = vi.fn()
    render(<ExerciseShell {...baseProps} onSkip={onSkip} />)
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('calls onContinue when Continue is clicked', () => {
    const onContinue = vi.fn()
    render(
      <ExerciseShell
        {...baseProps}
        onContinue={onContinue}
        result={{ isCorrect: false, userAnswer: 'wrong', timeMs: 500 }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})

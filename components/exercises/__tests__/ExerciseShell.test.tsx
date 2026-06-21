// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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

  it('auto-continues a correct result without detailed feedback', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    render(
      <ExerciseShell
        {...baseProps}
        onContinue={onContinue}
        result={{ isCorrect: true, userAnswer: 'hello', timeMs: 500 }}
      />
    )
    act(() => { vi.advanceTimersByTime(900) })
    expect(onContinue).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('does not auto-continue a wrong result with explanation', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    render(
      <ExerciseShell
        {...baseProps}
        onContinue={onContinue}
        result={{
          isCorrect: false,
          userAnswer: 'wrong',
          timeMs: 500,
          feedback: {
            immediate: 'Not quite.',
            explanation: 'This word does not fit the sentence.',
          },
        }}
      />
    )
    act(() => { vi.advanceTimersByTime(1200) })
    expect(onContinue).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('renders detailed feedback fields', () => {
    render(
      <ExerciseShell
        {...baseProps}
        result={{
          isCorrect: false,
          userAnswer: 'go',
          timeMs: 500,
          feedback: {
            immediate: 'Check the verb form.',
            explanation: 'The subject needs a third-person verb.',
            expectedAnswer: 'goes',
            correction: 'She goes home.',
            tip: 'Look at the subject first.',
            example: 'He goes home.',
          },
        }}
      />
    )
    expect(screen.getByText('Check the verb form.')).toBeInTheDocument()
    expect(screen.getByText('The subject needs a third-person verb.')).toBeInTheDocument()
    expect(screen.getByText('She goes home.')).toBeInTheDocument()
    expect(screen.getByText('Look at the subject first.')).toBeInTheDocument()
    expect(screen.getByText('He goes home.')).toBeInTheDocument()
  })

  it('shows retry only when feedback allows it', () => {
    const { rerender } = render(
      <ExerciseShell
        {...baseProps}
        onRetry={vi.fn()}
        result={{ isCorrect: false, userAnswer: 'a', timeMs: 1, feedback: { immediate: 'No.' } }}
      />
    )
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    rerender(
      <ExerciseShell
        {...baseProps}
        onRetry={vi.fn()}
        result={{ isCorrect: false, userAnswer: 'a', timeMs: 1, feedback: { immediate: 'No.', canRetry: true } }}
      />
    )
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

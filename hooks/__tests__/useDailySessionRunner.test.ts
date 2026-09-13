// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readStepStorage,
  useDailySessionRunner,
  writeStepStorage,
  clearStepStorage,
} from '../useDailySessionRunner'
import type { DailyStep } from '@/hooks/useDailyPlan'

function makeStep(id: string, overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    id,
    kind: 'word_review',
    title: `Step ${id}`,
    subtitle: 'Subtitle',
    icon: 'book',
    exercises: [{ id: `ex-${id}-1` } as DailyStep['exercises'][number]],
    estMinutes: 3,
    ...overrides,
  }
}

describe('useDailySessionRunner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('starts in idle mode by default', () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const steps = [makeStep('s1'), makeStep('s2')]
    const { result } = renderHook(() =>
      useDailySessionRunner({ steps, markDone }),
    )

    expect(result.current.view).toEqual({ mode: 'idle' })
    expect(result.current.sessionKey).toBe(0)
  })

  it('startStep sets view to step and writes sessionStorage', () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const s1 = makeStep('s1')
    const { result } = renderHook(() =>
      useDailySessionRunner({ steps: [s1], markDone }),
    )

    act(() => {
      result.current.startStep(s1, 2)
    })

    expect(result.current.view).toEqual({
      mode: 'step',
      step: s1,
      exerciseIndex: 2,
    })
    expect(readStepStorage()).toEqual({ stepId: 's1', exerciseIndex: 2 })
    expect(result.current.sessionKey).toBe(1)
  })

  it('startStep ignores link-only / concept steps', () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const conceptStep = makeStep('c1', {
      kind: 'concept',
      href: '/mini-lessons/test',
      exercises: [],
    })
    const { result } = renderHook(() =>
      useDailySessionRunner({ steps: [conceptStep], markDone }),
    )

    act(() => {
      result.current.startStep(conceptStep)
    })

    expect(result.current.view).toEqual({ mode: 'idle' })
    expect(readStepStorage()).toBeNull()
  })

  it('advances from step to next pending step on completeStep', async () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const s1 = makeStep('s1')
    const s2 = makeStep('s2')
    const steps = [s1, s2]

    const getStepStatus = (id: string) => (id === 's1' ? 'done' : 'pending')

    const { result } = renderHook(() =>
      useDailySessionRunner({ steps, markDone, getStepStatus }),
    )

    act(() => {
      result.current.startStep(s1, 1)
    })

    expect(readStepStorage()).toEqual({ stepId: 's1', exerciseIndex: 1 })

    await act(async () => {
      await result.current.completeStep('s1')
    })

    expect(markDone).toHaveBeenCalledWith('s1')
    // Storage was cleared when completing s1
    expect(readStepStorage()).toBeNull()
    // Advanced to next pending step s2
    expect(result.current.view).toEqual({
      mode: 'step',
      step: s2,
      exerciseIndex: 0,
    })
    expect(result.current.sessionKey).toBe(2)
  })

  it('transitions to done view when completing the last pending step', async () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const s1 = makeStep('s1')
    const steps = [s1]

    const { result } = renderHook(() =>
      useDailySessionRunner({ steps, markDone }),
    )

    act(() => {
      result.current.startStep(s1)
    })

    await act(async () => {
      await result.current.completeStep('s1')
    })

    expect(markDone).toHaveBeenCalledWith('s1')
    expect(result.current.view).toEqual({ mode: 'done' })
    expect(readStepStorage()).toBeNull()
  })

  it('skips non-executable steps when looking for the next pending step', async () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const s1 = makeStep('s1')
    const concept = makeStep('concept:1', {
      kind: 'concept',
      href: '/mini-lessons/1',
      exercises: [],
    })
    const s2 = makeStep('s2')
    const steps = [s1, concept, s2]

    const { result } = renderHook(() =>
      useDailySessionRunner({ steps, markDone }),
    )

    act(() => {
      result.current.startStep(s1)
    })

    await act(async () => {
      await result.current.completeStep('s1')
    })

    // Should skip concept and land on s2
    expect(result.current.view).toEqual({
      mode: 'step',
      step: s2,
      exerciseIndex: 0,
    })
  })

  it('exitStep clears storage and resets to idle', () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const s1 = makeStep('s1')
    const { result } = renderHook(() =>
      useDailySessionRunner({ steps: [s1], markDone }),
    )

    act(() => {
      result.current.startStep(s1, 1)
    })
    expect(readStepStorage()).not.toBeNull()

    act(() => {
      result.current.exitStep()
    })

    expect(result.current.view).toEqual({ mode: 'idle' })
    expect(readStepStorage()).toBeNull()
  })

  it('resumeFromUrlStep restores step and exerciseIndex from storage', () => {
    const markDone = vi.fn().mockResolvedValue(undefined)
    const s1 = makeStep('s1')
    const s2 = makeStep('s2')
    writeStepStorage('s2', 3)

    const { result } = renderHook(() =>
      useDailySessionRunner({ steps: [s1, s2], markDone }),
    )

    act(() => {
      result.current.resumeFromUrlStep('s2')
    })

    expect(result.current.view).toEqual({
      mode: 'step',
      step: s2,
      exerciseIndex: 3,
    })

    // Second call should not do anything due to autoStartedRef
    act(() => {
      result.current.resumeFromUrlStep('s1')
    })
    expect(result.current.view).toEqual({
      mode: 'step',
      step: s2,
      exerciseIndex: 3,
    })
  })

  it('sessionStorage helper functions read, write and clear correctly', () => {
    expect(readStepStorage()).toBeNull()
    writeStepStorage('s10', 4)
    expect(readStepStorage()).toEqual({ stepId: 's10', exerciseIndex: 4 })
    clearStepStorage()
    expect(readStepStorage()).toBeNull()
  })
})

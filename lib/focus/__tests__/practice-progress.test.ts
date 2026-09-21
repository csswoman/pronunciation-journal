import { describe, expect, it } from 'vitest'
import { addFocusPractice, practicedDays, sprintDayAt } from '../practice-progress'
import type { FocusSprint } from '../types'

const sprint: FocusSprint = {
  id: 'sprint-1', userId: 'user-1', gaps: [], status: 'active',
  startsAt: '2026-09-20T10:00:00.000Z', endsAt: '2026-09-27T10:00:00.000Z',
  createdAt: '2026-09-20T10:00:00.000Z',
}

describe('focus practice progress', () => {
  it('distingue empezar de responder, y no duplica el mismo ejercicio', () => {
    const now = new Date('2026-09-20T11:00:00.000Z')
    const started = addFocusPractice(sprint, 'story-1', { kind: 'started' }, now)!
    expect(practicedDays(started)).toBe(0)
    expect(started.days[0].startedContentIds).toEqual(['story-1'])

    const answered = addFocusPractice({ ...sprint, practice: started }, 'story-1', { kind: 'answered', exerciseId: 'exercise-1' }, now)!
    expect(practicedDays(answered)).toBe(1)
    const repeated = addFocusPractice({ ...sprint, practice: answered }, 'story-1', { kind: 'answered', exerciseId: 'exercise-1' }, now)!
    expect(repeated.days[0].answeredExerciseKeys).toHaveLength(1)

    const completed = addFocusPractice({ ...sprint, practice: repeated }, 'story-1', { kind: 'completed' }, now)!
    expect(completed.days[0].completedContentIds).toEqual(['story-1'])
  })

  it('atribuye la práctica al día real del sprint y rechaza fuera de fechas', () => {
    const secondDay = new Date('2026-09-21T11:00:00.000Z')
    expect(sprintDayAt(sprint, secondDay)).toBe(2)
    const progress = addFocusPractice(sprint, 'drill-1', { kind: 'answered', exerciseId: 'one' }, secondDay)!
    expect(progress.days[0].day).toBe(2)
    expect(addFocusPractice(sprint, 'drill-1', { kind: 'started' }, new Date('2026-09-28T10:00:00.000Z'))).toBeNull()
  })
})

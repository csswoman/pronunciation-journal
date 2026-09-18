// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LevelConceptsProgressCard } from '../LevelConceptsProgressCard'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'

describe('LevelConceptsProgressCard', () => {
  const firstLevel = COURSE_PATH_CURRICULUM.levels[0]
  const firstLesson = firstLevel.units[0].lessons.find((l) => Boolean(l.slug))!
  const presentSimpleLesson = firstLevel.units
    .flatMap((u) => u.lessons)
    .find((l) => l.slug === 'a1-presente-simple')!

  it('shows route completion separately without claiming retention', () => {
    render(
      <LevelConceptsProgressCard
        initialLevel="a1"
        topics={[]}
        completedRoute={[
          {
            courseSlug: 'a1',
            lessonSlug: firstLesson.slug!,
            completedAt: new Date().toISOString(),
          },
        ]}
      />,
    )

    // Should show completed route in summary
    const matches = screen.getAllByText((_, el) => el?.textContent?.includes('1/37 completadas') ?? false)
    expect(matches.length).toBeGreaterThan(0)
    // The summary reports route coverage independently from retention.
    expect(screen.getAllByText(/ruta completada/i).length).toBe(1)

    // Completion alone must not place the lesson under Retenidos.
    expect(screen.queryByText(firstLesson.title)).toBeNull()

    // Switch to "Por iniciar" tab
    const pendingTab = screen.getByRole('tab', { name: /por iniciar/i })
    fireEvent.click(pendingTab)

    // Without topic_srs evidence it remains pending verification, while retaining
    // the independent route-completed badge.
    expect(screen.getByText(firstLesson.title)).toBeInTheDocument()
    expect(screen.getAllByText(/ruta completada/i).length).toBe(2)
  })

  it('reflects SRS learning topics appropriately', () => {
    render(
      <LevelConceptsProgressCard
        initialLevel="a1"
        topics={[
          {
            topic: 'grammar:present simple',
            srsStatus: 'learning',
            nextReviewAt: new Date().toISOString(),
            lastReviewedAt: new Date().toISOString(),
            repetitions: 1,
            intervalDays: 1,
          },
        ]}
        completedRoute={[]}
      />,
    )

    // Check En aprendizaje tab
    const reviewTab = screen.getByRole('tab', { name: /en aprendizaje/i })
    fireEvent.click(reviewTab)

    expect(screen.getByText(presentSimpleLesson.title)).toBeInTheDocument()
    expect(screen.getByText('En repaso')).toBeInTheDocument()
  })
})

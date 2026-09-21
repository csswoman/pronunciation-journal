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
    const firstTenLessons = firstLevel.units
      .flatMap((u) => u.lessons)
      .filter((l): l is typeof l & { slug: string } => Boolean(l.slug))
      .slice(0, 10)
    const totalLessons = firstLevel.units.flatMap((unit) => unit.lessons).filter(
      (lesson): lesson is typeof lesson & { slug: string } => Boolean(lesson.slug),
    ).length

    render(
      <LevelConceptsProgressCard
        initialLevel="a1"
        topics={[]}
        completedRoute={firstTenLessons.map((l) => ({
          courseSlug: 'a1',
          lessonSlug: l.slug,
          completedAt: new Date().toISOString(),
        }))}
      />,
    )

    // Main metric remains retention even when ten route lessons were completed.
    expect(screen.getByText(`0/${totalLessons} retenidos (0%)`)).toBeInTheDocument()
    expect(screen.getByText('lecciones recorridas').parentElement).toHaveTextContent(
      '10 lecciones recorridas',
    )

    // Completion alone must not place the lesson under Retenidos.
    expect(screen.queryByText(firstLesson.title)).toBeNull()

    // Switch to "Por iniciar" tab
    const pendingTab = screen.getByRole('tab', { name: /por iniciar/i })
    fireEvent.click(pendingTab)

    // Without topic_srs evidence it remains pending verification, while retaining
    // the independent route-completed badge.
    expect(screen.getByText(firstLesson.title)).toBeInTheDocument()
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

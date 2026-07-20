import { describe, expect, expectTypeOf, it } from 'vitest'
import { EXERCISE_SKILL_MATRIX, skillsForSlug } from '@/lib/progress/skill-matrix'
import type { ExerciseSlug } from '@/lib/practice/types'
import type { SkillTag } from '@/lib/progress/activity-types'
import { deriveSkillTags } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'

describe('EXERCISE_SKILL_MATRIX', () => {
  it('covers every ExerciseSlug with at least one skill', () => {
    const slugs = Object.keys(EXERCISE_SKILL_MATRIX) as ExerciseSlug[]
    expect(slugs.length).toBeGreaterThan(20)
    for (const slug of slugs) {
      expect(EXERCISE_SKILL_MATRIX[slug].length).toBeGreaterThan(0)
    }
  })

  it('maps productive slugs by modality', () => {
    expect(skillsForSlug('spoken_production')).toEqual(['speaking'])
    expect(skillsForSlug('written_production')).toEqual(['reading'])
    expect(skillsForSlug('sentence_transformation')).toEqual(['grammar'])
    expect(skillsForSlug('translation_es_en')).toEqual(['vocabulary', 'grammar'])
  })

  it('is exhaustively typed as Record<ExerciseSlug, readonly SkillTag[]>', () => {
    expectTypeOf(EXERCISE_SKILL_MATRIX).toExtend<
      Record<ExerciseSlug, readonly SkillTag[]>
    >()
  })
})

describe('deriveSkillTags', () => {
  it('derives skills from slugs only — context does not invent skills', () => {
    const completedAt = new Date()
    const results: ExerciseResult[] = [
      {
        exerciseId: '1',
        slug: 'dictation',
        exerciseTypeId: 4,
        isCorrect: true,
        timeMs: 100,
        contentId: 'a',
        context: 'sound_lab',
        completedAt,
      },
    ]
    // sound_lab context previously forced pronunciation+listening even for empty results;
    // with only dictation, listening is expected — pronunciation comes from phoneme slugs.
    expect(deriveSkillTags('sound_lab', buildSessionResult(results))).toEqual(['listening'])
    expect(deriveSkillTags('core-1000', buildSessionResult(results))).toEqual(['listening'])
  })
})

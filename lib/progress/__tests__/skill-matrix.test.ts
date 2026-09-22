import { describe, expect, expectTypeOf, it } from 'vitest'
import { EXERCISE_SKILL_MATRIX, resolveAnswerSkills, skillsForSlug } from '@/lib/progress/skill-matrix'
import type { ExerciseSlug } from '@/lib/practice/types'
import type { SkillTag } from '@/lib/progress/activity-types'
import { deriveSkillTags } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'

describe('EXERCISE_SKILL_MATRIX', () => {
  it('covers every ExerciseSlug, reserving untagged multiple choice for explicit task metadata', () => {
    const slugs = Object.keys(EXERCISE_SKILL_MATRIX) as ExerciseSlug[]
    expect(slugs.length).toBeGreaterThan(20)
    for (const slug of slugs) {
      if (slug === 'multiple_choice') continue
      expect(EXERCISE_SKILL_MATRIX[slug].length).toBeGreaterThan(0)
    }
  })

  it('maps productive slugs by modality without treating the response format as reading', () => {
    expect(skillsForSlug('spoken_production')).toEqual(['speaking'])
    expect(skillsForSlug('written_production')).toEqual(['writing'])
    expect(skillsForSlug('multiple_choice')).toEqual([])
    expect(skillsForSlug('sentence_transformation')).toEqual(['grammar'])
    expect(skillsForSlug('translation_es_en')).toEqual(['vocabulary', 'grammar'])
  })

  it('is exhaustively typed as Record<ExerciseSlug, readonly SkillTag[]>', () => {
    expectTypeOf(EXERCISE_SKILL_MATRIX).toExtend<
      Record<ExerciseSlug, readonly SkillTag[]>
    >()
  })
})

describe('resolveAnswerSkills', () => {
  it.each([
    ['grammar multiple choice', 'multiple_choice', { taskSkill: 'grammar' }, ['grammar']],
    ['reading comprehension', 'multiple_choice', { taskSkill: 'reading' }, ['reading']],
    ['vocabulary recognition', 'multiple_choice', { taskSkill: 'vocabulary' }, ['vocabulary']],
    ['written production', 'written_production', { taskSkill: 'writing' }, ['writing']],
    ['dictation', 'sentence_dictation', { taskSkill: 'listening' }, ['listening']],
  ] as const)('attributes %s from the declared task', (_label, slug, payload, expected) => {
    expect(resolveAnswerSkills(slug, payload)).toEqual(expected)
  })

  it('leaves legacy multiple-choice rows untagged instead of projecting reading', () => {
    expect(resolveAnswerSkills('multiple_choice', undefined)).toEqual([])
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
    expect(deriveSkillTags('essential-words', buildSessionResult(results))).toEqual(['listening'])
  })

  it('uses the same task attribution as the fluency profile and ignores skipped rows', () => {
    const completedAt = new Date()
    const results: ExerciseResult[] = [
      {
        exerciseId: 'grammar-rule',
        slug: 'multiple_choice',
        exerciseTypeId: 17,
        isCorrect: true,
        timeMs: 100,
        contentId: 'grammar-rule',
        context: 'daily',
        status: 'answered',
        exercisePayload: { taskSkill: 'grammar' },
        completedAt,
      },
      {
        exerciseId: 'skipped-reading',
        slug: 'multiple_choice',
        exerciseTypeId: 17,
        isCorrect: false,
        userAnswer: 'skip',
        timeMs: 100,
        contentId: 'reading',
        context: 'daily',
        status: 'skipped',
        exercisePayload: { taskSkill: 'reading' },
        completedAt,
      },
    ]

    expect(deriveSkillTags('daily', buildSessionResult(results))).toEqual(['grammar'])
  })
})

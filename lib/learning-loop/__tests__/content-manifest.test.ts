import { describe, expect, it } from 'vitest'
import {
  buildLearningContentManifest,
  NON_EVALUABLE_CONTENT_ALLOWLIST,
  summarizeLearningContentManifest,
  validateLearningContentManifest,
} from '@/lib/learning-loop/content-manifest'
import { theoryTopicForDeck, theoryTopicForMiniLesson } from '@/lib/learning-loop/theory-targets'
import { loadEssentialWords } from '@/lib/essential-words/data'
import { listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { getAllMiniLessons } from '@/lib/content/lessons'
import { listMissions } from '@/lib/ai-practice/missions/registry'

describe('learning-loop content manifest', () => {
  it('projects every authored surface without dangling targets or hidden gaps', async () => {
    const manifest = await buildLearningContentManifest()
    const summary = summarizeLearningContentManifest(manifest)
    const miniLessons = await getAllMiniLessons()
    expect(summary).toMatchObject({
      grammar_deck: listAllDecks().length,
      mini_lesson: miniLessons.length,
      essential_words: new Set(loadEssentialWords().map((word) => word.word.trim().toLowerCase())).size,
      oral_mission: listMissions().length,
      tracking: 3,
    })
    expect(validateLearningContentManifest(manifest)).toEqual([])
  }, 30000)

  it('keeps the non-evaluable allowlist explicit and live', async () => {
    const manifest = await buildLearningContentManifest()
    expect(NON_EVALUABLE_CONTENT_ALLOWLIST).toEqual([
      expect.objectContaining({ contentId: 'tracking-source:lesson' }),
    ])
    expect(validateLearningContentManifest(manifest, [])).toContainEqual(
      expect.objectContaining({
        code: 'unallowlisted_non_evaluable_content',
        contentId: 'tracking-source:lesson',
      }),
    )
  })

  it('shares only authored theory equivalences', () => {
    expect(theoryTopicForMiniLesson('articles-a-an-the')).toBe(theoryTopicForDeck('a1-articulos-basicos'))
    expect(theoryTopicForMiniLesson('advanced-idioms')).toBe('mini:advanced idioms')
  })

  it('rejects duplicate ids and unknown pronunciation refs', async () => {
    const [entry] = await buildLearningContentManifest()
    expect(entry).toBeDefined()
    const invalid = {
      ...entry!,
      targetRefs: [{ namespace: 'pronunciation' as const, id: 'missing.target' as never }],
    }
    const issues = validateLearningContentManifest([invalid, invalid], [])
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'duplicate_content_id',
      'unknown_pronunciation_target',
    ]))
  })
})

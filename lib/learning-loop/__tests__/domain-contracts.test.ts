import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { buildLearningContentManifest } from '../content-manifest'
import { auditEvidenceExits } from '../evidence-exits'
import type { LearningSurface } from '../types'

describe('learning domain contracts', () => {
  it('connects every objective surface to target, evidence, session, and domain owners', async () => {
    const entries = await buildLearningContentManifest()
    expect(auditEvidenceExits(entries)).toEqual([])

    const requiredSurfaces: LearningSurface[] = [
      'course_path',
      'grammar_deck',
      'mini_lesson',
      'essential_words',
      'chunks',
      'sound_lab',
      'pronunciation_path',
      'oral_mission',
      'tracking',
      'immersion',
      'user_decks',
      'games',
    ]
    for (const surface of requiredSurfaces) {
      expect(entries.some((entry) => entry.surface === surface), `${surface} has no contract`).toBe(true)
    }

    for (const entry of entries.filter((candidate) => candidate.practice.status === 'objective')) {
      expect(entry.targetRefs.length, `${entry.contentId} lacks canonical targets`).toBeGreaterThan(0)
      expect(
        entry.owners.some((owner) => owner !== 'activity_sessions' && owner !== 'tracked_items'),
        `${entry.contentId} lacks a learning owner`,
      ).toBe(true)
    }
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  findSoundForTargetId,
  resolveDiagnosticPrescriptionTarget,
  markDiagnosticPrescriptionSessionComplete,
} from '../diagnostic-prescription'
import type { Sound } from '@/lib/phoneme-practice/types'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'

vi.mock('@/lib/pronunciation/assessment/persistence', () => ({
  getLocalPronunciationAssessments: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    pronunciationAssessments: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
}))

import { getLocalPronunciationAssessments } from '@/lib/pronunciation/assessment/persistence'

describe('diagnostic-prescription', () => {
  const mockSounds: Sound[] = [
    { id: 1, ipa: '/iː/', example: 'sheep', category: 'vowel', type: 'monophthong', difficulty: 1 },
    { id: 2, ipa: '/ɪ/', example: 'ship', category: 'vowel', type: 'monophthong', difficulty: 2 },
    { id: 3, ipa: '/θ/', example: 'think', category: 'consonant', type: 'fricative', difficulty: 3 },
  ]

  describe('findSoundForTargetId', () => {
    it('finds sound by contrast pair', () => {
      const match = findSoundForTargetId('segmental.contrast./iː/_/ɪ/', mockSounds)
      expect(match).not.toBeNull()
      expect(['/iː/', '/ɪ/']).toContain(match?.ipa)
    })

    it('finds sound matching IPA substring in target ID', () => {
      const match = findSoundForTargetId('consonant.th.θ', mockSounds)
      expect(match?.ipa).toBe('/θ/')
    })

    it('returns null when target cannot be mapped', () => {
      const match = findSoundForTargetId('prosody.rhythm', mockSounds)
      expect(match).toBeNull()
    })
  })

  describe('resolveDiagnosticPrescriptionTarget', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns null if user has no assessments', async () => {
      vi.mocked(getLocalPronunciationAssessments).mockResolvedValue([])
      const result = await resolveDiagnosticPrescriptionTarget('u1', mockSounds)
      expect(result).toBeNull()
    })

    it('returns null if assessment is older than 14 days', async () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 86_400_000).toISOString()
      vi.mocked(getLocalPronunciationAssessments).mockResolvedValue([
        {
          id: 'a1',
          userId: 'u1',
          schemaVersion: 1,
          completedAt: fifteenDaysAgo,
          createdAt: fifteenDaysAgo,
          result: {
            prescription: {
              sessions: [
                { targetId: 'segmental.contrast./iː/_/ɪ/', reason: 'Focus on sheep/ship', style: 'perception' },
              ],
            },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ])

      const result = await resolveDiagnosticPrescriptionTarget('u1', mockSounds)
      expect(result).toBeNull()
    })

    it('resolves active session and mapped sound when assessment is recent', async () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString()
      vi.mocked(getLocalPronunciationAssessments).mockResolvedValue([
        {
          id: 'a1',
          userId: 'u1',
          schemaVersion: 1,
          completedAt: yesterday,
          createdAt: yesterday,
          result: {
            prescription: {
              sessions: [
                { targetId: 'segmental.contrast./iː/_/ɪ/', reason: 'Day 1 perception', style: 'perception' },
                { targetId: 'consonant.th.θ', reason: 'Day 2 drill', style: 'drill' },
              ],
            },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ])

      const result = await resolveDiagnosticPrescriptionTarget('u1', mockSounds)
      expect(result).not.toBeNull()
      expect(result?.dayIndex).toBe(1)
      expect(result?.session.targetId).toBe('consonant.th.θ')
      expect(result?.sound?.ipa).toBe('/θ/')
    })

    it('advances to next pending session index based on completedSessionIndices', async () => {
      const justNow = new Date().toISOString()
      vi.mocked(getLocalPronunciationAssessments).mockResolvedValue([
        {
          id: 'a1',
          userId: 'u1',
          schemaVersion: 1,
          completedAt: justNow,
          createdAt: justNow,
          result: {
            prescription: {
              sessions: [
                { targetId: 'segmental.contrast./iː/_/ɪ/', reason: 'Day 1 perception', style: 'perception' },
                { targetId: 'consonant.th.θ', reason: 'Day 2 drill', style: 'drill' },
                { targetId: 'vowel.long.iː', reason: 'Day 3 production', style: 'production' },
              ],
            },
            completedSessionIndices: [0], // Ya completó el día 0
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ])

      const result = await resolveDiagnosticPrescriptionTarget('u1', mockSounds)
      expect(result).not.toBeNull()
      expect(result?.dayIndex).toBe(1) // Avanza al día 1 incluso siendo el mismo día
      expect(result?.session.targetId).toBe('consonant.th.θ')
    })
  })

  describe('markDiagnosticPrescriptionSessionComplete', () => {
    it('appends completed session index and enqueues update', async () => {
      vi.mocked(db.pronunciationAssessments.get).mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        schemaVersion: 1,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        result: {
          prescription: { sessions: [] },
          completedSessionIndices: [0],
        },
      })

      await markDiagnosticPrescriptionSessionComplete('u1', 'a1', 1)

      expect(db.pronunciationAssessments.update).toHaveBeenCalledWith('a1', {
        result: expect.objectContaining({
          completedSessionIndices: [0, 1],
        }),
      })

      expect(enqueue).toHaveBeenCalledWith(
        'u1',
        'pronunciation_assessments',
        'update',
        expect.objectContaining({
          id: 'a1',
          result: expect.objectContaining({
            completedSessionIndices: [0, 1],
          }),
        }),
        undefined,
        'id',
      )
    })
  })
})

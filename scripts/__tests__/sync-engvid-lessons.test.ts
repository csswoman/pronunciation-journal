import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/supabase/types'
import {
  parseSyncFlags,
  resolveUrls,
  runSync,
  toRow,
  fromRow,
} from '../sync-engvid-lessons'
import {
  cefrToEngVidLevel,
  findCanonicalTopic,
  sortCandidatesByRelevance,
  applyBalancedFallback,
  type CandidateEvaluation,
} from '../../lib/immersion/topic-matcher'
import type { ImmersionLesson } from '../../lib/immersion/types'

describe('scripts/sync-engvid-lessons', () => {
  describe('1. Parseo de banderas --topic y --route-lesson', () => {
    it('parsea correctamente --topic con limit y level', () => {
      const flags = parseSyncFlags([
        '--topic',
        'a1-present-simple-routines',
        '--level',
        'A2',
        '--limit',
        '5',
      ])
      expect(flags.topic).toBe('a1-present-simple-routines')
      expect(flags.level).toBe('A2')
      expect(flags.limit).toBe(5)
      expect(flags.dryRun).toBe(false)
    })

    it('parsea correctamente --route-lesson y flag --dry-run', () => {
      const flags = parseSyncFlags([
        '--route-lesson',
        'b1-conditionals',
        '--dry-run',
        '--limit',
        '3',
      ])
      expect(flags.topic).toBe('b1-conditionals')
      expect(flags.dryRun).toBe(true)
      expect(flags.limit).toBe(3)
    })

    it('parsea correctamente --sync-level y --all-topics', () => {
      const flagsLevel = parseSyncFlags(['--sync-level', 'A2', '--dry-run'])
      expect(flagsLevel.syncLevel).toBe('A2')
      expect(flagsLevel.dryRun).toBe(true)

      const flagsAll = parseSyncFlags(['--all-topics', '--dry-run'])
      expect(flagsAll.allTopics).toBe(true)
      expect(flagsAll.dryRun).toBe(true)
    })
  })

  describe('2. Preservación de comportamiento sin banderas de tema (Legacy)', () => {
    it('mantiene flags legacy cuando no se especifica tema', () => {
      const flags = parseSyncFlags([
        '--balance',
        '--limit',
        '30',
        '--archive',
        '--page',
        '3',
      ])
      expect(flags.topic).toBeUndefined()
      expect(flags.balance).toBe(true)
      expect(flags.archive).toBe(true)
      expect(flags.page).toBe('3')
      expect(flags.limit).toBe(30)
    })

    it('prioriza flag --url sobre otros modos', async () => {
      const singleUrl = 'https://www.engvid.com/learn-english-test/'
      const urls = await resolveUrls(['--url', singleUrl], [])
      expect(urls).toEqual([singleUrl])
    })
  })

  describe('3. Filtrado y mapeo de nivel', () => {
    it('mapea correctamente niveles CEFR a los 3 niveles honestos de EngVid', () => {
      expect(cefrToEngVidLevel('A1')).toBe('A2')
      expect(cefrToEngVidLevel('A2')).toBe('A2')
      expect(cefrToEngVidLevel('B1')).toBe('B1')
      expect(cefrToEngVidLevel('B2')).toBe('B1')
      expect(cefrToEngVidLevel('C1')).toBe('C1')
      expect(cefrToEngVidLevel('C2')).toBe('C1')
    })

    it('obtiene el nivel y términos de búsqueda canónicos de una lección de la Ruta', () => {
      const topic = findCanonicalTopic('a1-present-simple-routines')
      expect(topic).not.toBeNull()
      if (topic) {
        expect(topic.engVidLevel).toBe('A2')
        expect(topic.searchTerms.length).toBeGreaterThan(0)
      }
    })
  })

  describe('4. Ordenamiento por relevancia pedagógica', () => {
    it('ordena candidatos estrictamente: exact > related > complementary > needs_review', () => {
      const candidates: CandidateEvaluation[] = [
        {
          url: 'https://engvid.com/3',
          slug: 'comp-3',
          title: 'Complementary Video',
          level: 'A2',
          youtubeVideoId: 'y3',
          relevance: 'complementary',
          reason: 'Contexto adicional',
          confidence: 0.9,
          assignmentType: 'direct',
        },
        {
          url: 'https://engvid.com/1',
          slug: 'exact-1',
          title: 'Exact Video Low Conf',
          level: 'A2',
          youtubeVideoId: 'y1',
          relevance: 'exact',
          reason: 'Enseña el tema exacto',
          confidence: 0.8,
          assignmentType: 'direct',
        },
        {
          url: 'https://engvid.com/4',
          slug: 'exact-top',
          title: 'Exact Video High Conf',
          level: 'A2',
          youtubeVideoId: 'y4',
          relevance: 'exact',
          reason: 'Enseña el tema exacto',
          confidence: 0.95,
          assignmentType: 'direct',
        },
        {
          url: 'https://engvid.com/2',
          slug: 'related-2',
          title: 'Related Video',
          level: 'A2',
          youtubeVideoId: 'y2',
          relevance: 'related',
          reason: 'Tema relacionado',
          confidence: 0.85,
          assignmentType: 'direct',
        },
        {
          url: 'https://engvid.com/5',
          slug: 'review-5',
          title: 'Needs Review Video',
          level: 'A2',
          youtubeVideoId: 'y5',
          relevance: 'needs_review',
          reason: 'Información ambigua',
          confidence: 0.5,
          assignmentType: 'direct',
        },
      ]

      const sorted = sortCandidatesByRelevance(candidates)
      expect(sorted[0].slug).toBe('exact-top')
      expect(sorted[1].slug).toBe('exact-1')
      expect(sorted[2].slug).toBe('related-2')
      expect(sorted[3].slug).toBe('comp-3')
      expect(sorted[4].slug).toBe('review-5')
    })
  })

  describe('5. Fallback con --balance (Hard Rule: jamás clasifica como exact)', () => {
    it('añade videos de fallback marcándolos estrictamente como related y assignmentType fallback', () => {
      const directCandidates: CandidateEvaluation[] = [
        {
          url: 'https://engvid.com/direct-1',
          slug: 'direct-1',
          title: 'Direct Match',
          level: 'A2',
          youtubeVideoId: 'd1',
          relevance: 'exact',
          reason: 'Match exacto',
          confidence: 0.9,
          assignmentType: 'direct',
        },
      ]

      const fallbackUrls = [
        'https://engvid.com/fallback-1/',
        'https://engvid.com/fallback-2/',
      ]

      const result = applyBalancedFallback(directCandidates, fallbackUrls, 3)

      expect(result).toHaveLength(3)
      expect(result[0].relevance).toBe('exact')
      expect(result[0].assignmentType).toBe('direct')

      // Hard rule: Los videos de fallback JAMÁS deben ser 'exact'
      const fallbacks = result.slice(1)
      for (const fb of fallbacks) {
        expect(fb.assignmentType).toBe('fallback')
        expect(fb.relevance).not.toBe('exact')
        expect(['related', 'complementary']).toContain(fb.relevance)
        expect(fb.reason).toMatch(/fallback/i)
      }
    })
  })

  describe('6. Modo --dry-run (cero escrituras en base de datos)', () => {
    it('garantiza que --dry-run no escribe en Supabase', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
          upsert: mockUpsert,
        }),
      } as unknown as SupabaseClient<Database>

      const result = await runSync(
        ['--topic', 'a1-present-simple-routines', '--dry-run', '--limit', '2'],
        mockSupabase,
      )

      expect(result.dryRun).toBe(true)
      // Supabase jamás debe recibir operaciones de escritura (upsert) en modo dry-run
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('garantiza que --dry-run sin tema tampoco escribe en Supabase', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
          upsert: mockUpsert,
        }),
      } as unknown as SupabaseClient<Database>

      const result = await runSync(['--dry-run', '--limit', '2'], mockSupabase)

      expect(result.dryRun).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  describe('7. Mapeo de metadatos en toRow y fromRow', () => {
    it('preserva metadatos pedagógicos en filas de Supabase', () => {
      const lesson: ImmersionLesson = {
        id: 'test-id',
        slug: 'test-slug',
        youtubeVideoId: 'video123',
        title: 'Test Lesson',
        teacher: 'Adam',
        teacherChannelUrl: 'https://youtube.com/@engVidAdam',
        level: 'A2',
        topic: 'speaking',
        durationMinutes: 10,
        summary: 'Resumen',
        timestamps: [],
        keyVocabulary: [],
        targetPhrases: [],
        quiz: [],
        metadata: {
          canonicalTopic: 'a1-present-simple-routines',
          relation: 'exact',
          reason: 'Enseña rutinas en presente simple.',
          assignmentType: 'direct',
          confidence: 0.95,
        },
      }

      const row = toRow(lesson)
      expect(row.metadata).toEqual({
        canonicalTopic: 'a1-present-simple-routines',
        relation: 'exact',
        reason: 'Enseña rutinas en presente simple.',
        assignmentType: 'direct',
        confidence: 0.95,
      })

      const restored = fromRow(row)
      expect(restored.metadata).toEqual(lesson.metadata)
    })
  })
})

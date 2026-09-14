import { LEARNING_CHUNKS } from './catalog'
import { buildChunkExercises, filterChunksForLevel } from './exercises'
import { buildPronunciationRouteExercises } from './queries'
import type { ChunkPracticeSession } from './queries'
import type { CEFRLevel } from '@/lib/exercises/cefr'

/** Opens one authored phrase directly without creating a parallel scheduler. */
export function loadFocusedChunkPracticeSession(
  chunkId: string,
  level: CEFRLevel,
  focus: 'default' | 'pronunciation' = 'default',
): ChunkPracticeSession | null {
  const eligible = filterChunksForLevel(LEARNING_CHUNKS, level)
  const chunk = eligible.find((candidate) => candidate.id === chunkId)
  if (!chunk) return null
  const exercises = focus === 'pronunciation'
    ? buildPronunciationRouteExercises(
        [chunk],
        chunk.contentGraph.pronunciationTargetIds,
        level,
      )
    : buildChunkExercises([chunk], eligible, 'practice', level)
  return { chunks: [chunk], exercises }
}

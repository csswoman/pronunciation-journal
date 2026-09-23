// Proyección de inmersión hacia el manifest. Separado de content-manifest.ts
// por tamaño de archivo (ver CLAUDE.md: no file exceeds 250 lines).
import { GENERATED_IMMERSION_INDEX } from './generated-immersion-index'
import type { LearningContentManifestEntry, NonEvaluableContentAllowance } from './types'

const NO_CANONICAL_TOPIC_REASON =
  'Video de inmersión sin tema canónico asignado (ver lib/immersion/canonical-topic.ts); el visionado y el quiz no tienen a qué target atribuir progreso.'

// Lecciones de inmersión sin tema canónico asignado (canonical-topic.ts /
// sync-engvid-lessons.ts no encontraron un target de la Ruta que coincida):
// exposición no evaluable, derivada de generated-immersion-index.ts. No se
// listan a mano porque el catálogo crece con cada `pnpm sync:engvid`; el
// contrato es "sin canonicalTopic → allowlisted", no una lista fija.
export const IMMERSION_NON_EVALUABLE_ALLOWANCES: readonly NonEvaluableContentAllowance[] =
  GENERATED_IMMERSION_INDEX
    .filter((lesson) => !lesson.metadata?.canonicalTopic)
    .map((lesson) => ({
      contentId: `immersion:${lesson.slug}`,
      reason: NO_CANONICAL_TOPIC_REASON,
    }))

export function immersionEntries(): LearningContentManifestEntry[] {
  return GENERATED_IMMERSION_INDEX.map((lesson) => {
    const canonicalTopic = lesson.metadata?.canonicalTopic
    if (!canonicalTopic) {
      return {
        contentId: `immersion:${lesson.slug}`,
        surface: 'immersion' as const,
        title: lesson.title,
        signals: ['exposure'] as const,
        targetRefs: [],
        practice: { status: 'none' as const, reason: NO_CANONICAL_TOPIC_REASON },
        owners: [] as const,
      }
    }
    return {
      contentId: `immersion:${lesson.slug}`,
      surface: 'immersion' as const,
      title: lesson.title,
      signals: ['exposure', 'completion'] as const,
      targetRefs: [{ namespace: 'topic' as const, id: canonicalTopic }],
      practice: {
        status: 'objective' as const,
        adapter: 'immersion_quiz',
        reason: 'Cada opción elegida del quiz se conserva como PracticeAnswer y el intento completo como activity_session.',
      },
      owners: ['immersion_lesson_progress', 'activity_sessions'] as const,
    }
  })
}

import { contentHrefForRefs } from '@/lib/pronunciation/path/content-href'
import { PATH_STAGE_ORDER } from '@/lib/pronunciation/path/curriculum'
import type { PathEvidenceBundle } from '@/lib/pronunciation/path/load-evidence'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStageId, PathUnit } from '@/lib/pronunciation/path/types'

export const EMPTY_EVIDENCE: PathEvidenceBundle = {
  completedContentKeys: new Set(),
  spokenAttempts: [],
  diagnosticPriorityIds: [],
  diagnosticByTargetId: new Map(),
}

export function resolveStageId(raw: string | undefined): PathStageId | null {
  if (!raw) return null
  if ((PATH_STAGE_ORDER as readonly string[]).includes(raw)) return raw as PathStageId
  const asIndex = Number(raw)
  if (Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= PATH_STAGE_ORDER.length) {
    return PATH_STAGE_ORDER[asIndex - 1]!
  }
  return null
}

export function hrefForUnit(unit: PathUnit | null): string {
  if (!unit) return '/courses/pronunciation'
  return (
    unit.practiceHref ??
    contentHrefForRefs(unit.contentRefs) ??
    targetIdToPronunciationPathRoute(unit.targetId)
  )
}

export function ctaLabelForHref(href: string, hasTarget: boolean): string {
  if (!hasTarget) return 'Ver etapas'
  if (href.startsWith('/practice/sounds')) return 'Practicar en Sound Lab'
  if (href.startsWith('/mini-lessons')) return 'Abrir lección'
  return 'Abrir esta etapa'
}

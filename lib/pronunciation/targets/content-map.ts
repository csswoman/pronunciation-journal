/**
 * Authored map from pronunciation targets to the content that teaches them.
 *
 * This is hand-written, not inferred: adding an entry is a deliberate
 * authoring decision, not a runtime title-matching guess. See
 * `docs/architecture/pronunciation-targets.md` "Non-goals".
 *
 * `lib/courses/__tests__/content-audit.test.ts` (via `getContentMapIssues`)
 * validates that every referenced file/slug exists on disk and every
 * referenced target id exists in the registry.
 */

import fs from 'node:fs'
import path from 'node:path'
import { getTarget, PRONUNCIATION_TARGETS, contrastTargetId, targetId } from './registry'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import type { PronunciationTargetId } from './types'

export type ContentKind = 'public_lesson' | 'grammar_deck'

export interface ContentMapEntry {
  targetId: PronunciationTargetId
  kind: ContentKind
  /** Filename without extension under `public/lessons/` or `public/grammar-decks/`. */
  slug: string
}

/**
 * Genuinely ambiguous content deliberately left unmapped, with the reason.
 * Audited so the omission is a documented decision, not an oversight.
 */
export interface UnmappedAuditEntry {
  slug: string
  kind: ContentKind
  reason: string
}

export const CONTENT_MAP: readonly ContentMapEntry[] = [
  { targetId: targetId('segmental.phoneme./ə/'), kind: 'public_lesson', slug: 'schwa-sound' },
  { targetId: contrastTargetId('/θ/', '/ð/'), kind: 'public_lesson', slug: 'th-sounds' },
  { targetId: targetId('prosody.word-stress'), kind: 'public_lesson', slug: 'word-stress-basics' },
  { targetId: targetId('prosody.sentence-stress'), kind: 'public_lesson', slug: 'sentence-stress' },
  {
    targetId: targetId('prosody.intonation.rising-question'),
    kind: 'public_lesson',
    slug: 'intonation-questions',
  },
  { targetId: targetId('connected.linking'), kind: 'public_lesson', slug: 'connected-speech' },
  { targetId: targetId('connected.elision'), kind: 'public_lesson', slug: 'connected-speech' },
  { targetId: targetId('connected.assimilation'), kind: 'public_lesson', slug: 'connected-speech' },
  {
    targetId: targetId('connected.reduction.gonna'),
    kind: 'public_lesson',
    slug: 'basic-listening-reductions',
  },
  { targetId: targetId('connected.reduction.gonna'), kind: 'grammar_deck', slug: 'cs-reductions' },
  { targetId: targetId('connected.linking'), kind: 'grammar_deck', slug: 'cs-linking' },
  { targetId: targetId('connected.elision'), kind: 'grammar_deck', slug: 'cs-elision' },
  { targetId: targetId('connected.assimilation'), kind: 'grammar_deck', slug: 'cs-assimilation' },
]

/**
 * Content left deliberately unmapped despite name proximity to a target —
 * documented so reviewers can see the decision was made, not missed.
 */
export const UNMAPPED_AUDIT: readonly UnmappedAuditEntry[] = [
  {
    slug: 'linking-words-basic',
    kind: 'public_lesson',
    reason:
      'Discourse connectors (however, therefore) — not phonetic linking across word boundaries. Name collision with connected.linking; do not map.',
  },
  {
    slug: 'phonemic-awareness-advanced',
    kind: 'public_lesson',
    reason:
      'Covers multiple segmental contrasts without a single dominant target; needs per-section authoring before it can map to one target id.',
  },
  {
    slug: 'vowel-length',
    kind: 'public_lesson',
    reason:
      'Spans several vowel contrasts (not just iː/ɪ); mapping to one contrast target would misrepresent scope.',
  },
]

export interface ContentMapIssue {
  code: 'unknown_target' | 'missing_file' | 'unknown_authored_target'
  detail: string
}

function getUnknownTargetIssues(targetIds: readonly string[], source: string): ContentMapIssue[] {
  return targetIds.flatMap((candidate) => {
    const lookup = getTarget(candidate)
    return lookup.ok
      ? []
      : [{
          code: 'unknown_authored_target' as const,
          detail: `${source} references ${lookup.error.kind} pronunciation target id "${candidate}"`,
        }]
  })
}

function getCurriculumTargetRefs(): { source: string; targetIds: readonly string[] }[] {
  return [...COURSE_PATH_CURRICULUM.levels, ...COURSE_PATH_CURRICULUM.electiveTracks].flatMap((level) =>
    level.units.flatMap((unit) =>
      unit.lessons
        .filter((lesson) => lesson.pronunciationTargetIds?.length)
        .map((lesson) => ({
          source: `curriculum lesson "${lesson.title}"`,
          targetIds: lesson.pronunciationTargetIds ?? [],
        }))
    )
  )
}

function contentDir(kind: ContentKind): string {
  return kind === 'public_lesson'
    ? path.join(process.cwd(), 'public', 'lessons')
    : path.join(process.cwd(), 'public', 'grammar-decks')
}

/**
 * Validates the content map: every target id must exist in the registry,
 * every referenced slug must exist on disk. Used by the content audit test
 * to produce zero dangling references.
 */
export function getContentMapIssues(): ContentMapIssue[] {
  const issues: ContentMapIssue[] = []

  for (const entry of CONTENT_MAP) {
    if (!PRONUNCIATION_TARGETS[entry.targetId]) {
      issues.push({
        code: 'unknown_target',
        detail: `content-map entry references unknown target id "${entry.targetId}" (slug: ${entry.slug})`,
      })
    }

    const filePath = path.join(contentDir(entry.kind), `${entry.slug}.json`)
    if (!fs.existsSync(filePath)) {
      issues.push({
        code: 'missing_file',
        detail: `content-map entry references missing ${entry.kind} file for slug "${entry.slug}"`,
      })
    }
  }

  for (const reference of getCurriculumTargetRefs()) {
    issues.push(...getUnknownTargetIssues(reference.targetIds, reference.source))
  }

  const decksDir = contentDir('grammar_deck')
  for (const file of fs.readdirSync(decksDir).filter((name) => name.endsWith('.json'))) {
    const filePath = path.join(decksDir, file)
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { pronunciationTargetIds?: unknown }
      if (Array.isArray(data.pronunciationTargetIds)) {
        issues.push(
          ...getUnknownTargetIssues(
            data.pronunciationTargetIds.filter((value): value is string => typeof value === 'string'),
            `grammar deck "${file.replace(/\.json$/, '')}"`
          )
        )
      }
    } catch {
      // Structural JSON/schema errors are reported by the grammar-deck audit.
    }
  }

  return issues
}

/** Deterministic coverage summary by target category, for the content audit. */
export function getCoverageSummary(): Record<string, number> {
  const summary: Record<string, number> = {}
  for (const targetIdKey of Object.keys(PRONUNCIATION_TARGETS)) {
    const target = PRONUNCIATION_TARGETS[targetIdKey]
    const count = CONTENT_MAP.filter((e) => e.targetId === target.id).length
    summary[target.category] = (summary[target.category] ?? 0) + count
  }
  return summary
}

export function getContentForTarget(id: PronunciationTargetId): readonly ContentMapEntry[] {
  return CONTENT_MAP.filter((e) => e.targetId === id)
}

/**
 * Authored map from pronunciation targets to the content that teaches them.
 *
 * This is hand-written, not inferred: adding an entry is a deliberate
 * authoring decision, not a runtime title-matching guess. See
 * `docs/architecture/pronunciation-targets.md` "Non-goals".
 *
 * Disk/registry validation lives in `content-map-audit.ts` (Node-only) so
 * this module stays safe for client components.
 */

import { PRONUNCIATION_TARGETS, contrastTargetId, targetId } from './registry'
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
  { targetId: targetId('prosody.rhythm'), kind: 'public_lesson', slug: 'rhythm-and-fluency' },
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
  { targetId: targetId('segmental.phoneme./ɹ/'), kind: 'grammar_deck', slug: 'a1-sonido-r-americano' },
  { targetId: contrastTargetId('/æ/', '/ʌ/'), kind: 'grammar_deck', slug: 'a1-vocales-ae-ua' },
  { targetId: targetId('segmental.phoneme./ə/'), kind: 'grammar_deck', slug: 'a1-pronunciacion-basica' },
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
    slug: 'linking-words-intermediate',
    kind: 'public_lesson',
    reason:
      'Discourse connectors (although, despite, furthermore) — not phonetic linking across word boundaries. Name collision with connected.linking; do not map.',
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

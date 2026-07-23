/**
 * Frozen registry of canonical pronunciation targets. See
 * `docs/architecture/pronunciation-targets.md` for the full contract.
 */

import { contrastKey } from '@/lib/phoneme-practice/phoneme-similarity'
import type {
  EvidenceCapability,
  PronunciationTarget,
  PronunciationTargetId,
  TargetLookupResult,
  TargetValidationIssue,
} from './types'
import { OBJECTIVE_EVIDENCE_CAPABILITIES, UNAVAILABLE_EVIDENCE_CAPABILITIES } from './types'

function id(raw: string): PronunciationTargetId {
  return raw as PronunciationTargetId
}

/** Brands a known-valid registry id string. Prefer `contrastTargetId`/`phonemeTargetId` for those families. */
export function targetId(raw: string): PronunciationTargetId {
  return id(raw)
}

/** Builds a `segmental.contrast.<canonical-pair>` id from two IPA symbols. */
export function contrastTargetId(ipaA: string, ipaB: string): PronunciationTargetId {
  return id(`segmental.contrast.${contrastKey(ipaA, ipaB)}`)
}

/** Builds a `segmental.phoneme.<ipa-key>` id from a single IPA symbol. */
export function phonemeTargetId(ipa: string): PronunciationTargetId {
  return id(`segmental.phoneme.${ipa}`)
}

const TH_CONTRAST: PronunciationTarget = {
  id: contrastTargetId('/θ/', '/ð/'),
  category: 'segmental.contrast',
  label: 'TH voiceless/voiced contrast (θ/ð)',
  recommendedCefr: 'A2',
  prerequisites: [],
  evidenceCapabilities: ['perception', 'controlled_production', 'stt_intelligibility'],
  masteryEligible: true,
  contrastPair: ['/θ/', '/ð/'],
}

const SHEEP_SHIP_CONTRAST: PronunciationTarget = {
  id: contrastTargetId('/iː/', '/ɪ/'),
  category: 'segmental.contrast',
  label: 'Tense/lax vowel contrast (iː/ɪ)',
  recommendedCefr: 'A2',
  prerequisites: [],
  evidenceCapabilities: ['perception', 'controlled_production', 'stt_intelligibility'],
  masteryEligible: true,
  contrastPair: ['/iː/', '/ɪ/'],
}

const SCHWA_PHONEME: PronunciationTarget = {
  id: phonemeTargetId('/ə/'),
  category: 'segmental.phoneme',
  label: 'Schwa (ə)',
  recommendedCefr: 'A2',
  prerequisites: [],
  evidenceCapabilities: ['perception', 'controlled_production', 'stt_intelligibility'],
  masteryEligible: true,
}

const WORD_STRESS: PronunciationTarget = {
  id: id('prosody.word-stress'),
  category: 'prosody.word-stress',
  label: 'Word stress placement',
  recommendedCefr: 'A2',
  prerequisites: [id(SCHWA_PHONEME.id)],
  evidenceCapabilities: ['perception', 'controlled_production', 'stt_intelligibility'],
  masteryEligible: true,
}

const SENTENCE_STRESS: PronunciationTarget = {
  id: id('prosody.sentence-stress'),
  category: 'prosody.sentence-stress',
  label: 'Sentence stress (content vs. function words)',
  recommendedCefr: 'B1',
  prerequisites: [WORD_STRESS.id],
  evidenceCapabilities: ['perception', 'contextual_production', 'stt_intelligibility'],
  masteryEligible: true,
}

const RHYTHM: PronunciationTarget = {
  id: id('prosody.rhythm'),
  category: 'prosody.rhythm',
  label: 'Stress-timed rhythm',
  recommendedCefr: 'B1',
  prerequisites: [SENTENCE_STRESS.id],
  evidenceCapabilities: ['perception', 'contextual_production'],
  masteryEligible: false,
}

const INTONATION_RISING_QUESTION: PronunciationTarget = {
  id: id('prosody.intonation.rising-question'),
  category: 'prosody.intonation',
  label: 'Rising intonation (yes/no questions)',
  recommendedCefr: 'B1',
  prerequisites: [SENTENCE_STRESS.id],
  evidenceCapabilities: ['perception', 'contextual_production'],
  masteryEligible: false,
}

const CONNECTED_REDUCTION_GONNA: PronunciationTarget = {
  id: id('connected.reduction.gonna'),
  category: 'connected.reduction',
  label: "Reduction: going to → gonna",
  recommendedCefr: 'B1',
  prerequisites: [SENTENCE_STRESS.id],
  evidenceCapabilities: ['perception', 'contextual_production', 'stt_intelligibility'],
  masteryEligible: true,
}

const CONNECTED_LINKING: PronunciationTarget = {
  id: id('connected.linking'),
  category: 'connected.linking',
  label: 'Linking sounds across word boundaries',
  recommendedCefr: 'B1',
  prerequisites: [RHYTHM.id],
  evidenceCapabilities: ['perception', 'contextual_production'],
  masteryEligible: false,
}

const CONNECTED_ELISION: PronunciationTarget = {
  id: id('connected.elision'),
  category: 'connected.elision',
  label: 'Elision (sounds that drop)',
  recommendedCefr: 'B2',
  prerequisites: [CONNECTED_LINKING.id],
  evidenceCapabilities: ['perception', 'contextual_production'],
  masteryEligible: false,
}

const CONNECTED_ASSIMILATION: PronunciationTarget = {
  id: id('connected.assimilation'),
  category: 'connected.assimilation',
  label: "Assimilation (doncha, didja)",
  recommendedCefr: 'B2',
  prerequisites: [CONNECTED_LINKING.id],
  evidenceCapabilities: ['perception', 'contextual_production'],
  masteryEligible: false,
}

/** Frozen registry keyed by target id. Add new targets here only. */
export const PRONUNCIATION_TARGETS: Readonly<Record<string, PronunciationTarget>> = Object.freeze({
  [TH_CONTRAST.id]: TH_CONTRAST,
  [SHEEP_SHIP_CONTRAST.id]: SHEEP_SHIP_CONTRAST,
  [SCHWA_PHONEME.id]: SCHWA_PHONEME,
  [WORD_STRESS.id]: WORD_STRESS,
  [SENTENCE_STRESS.id]: SENTENCE_STRESS,
  [RHYTHM.id]: RHYTHM,
  [INTONATION_RISING_QUESTION.id]: INTONATION_RISING_QUESTION,
  [CONNECTED_REDUCTION_GONNA.id]: CONNECTED_REDUCTION_GONNA,
  [CONNECTED_LINKING.id]: CONNECTED_LINKING,
  [CONNECTED_ELISION.id]: CONNECTED_ELISION,
  [CONNECTED_ASSIMILATION.id]: CONNECTED_ASSIMILATION,
})

/** Typed lookup. Unknown ids return a typed error — never a silent fallback. */
export function getTarget(targetId: string): TargetLookupResult {
  if (!isPronunciationTargetIdFormat(targetId)) {
    return { ok: false, error: { kind: 'invalid_id_format', id: targetId } }
  }
  const target = PRONUNCIATION_TARGETS[targetId]
  if (!target) return { ok: false, error: { kind: 'not_found', id: targetId } }
  return { ok: true, target }
}

/** Shape validation is intentionally separate from registry membership. */
export function isPronunciationTargetIdFormat(value: string): boolean {
  return /^(segmental\.(phoneme|contrast)\.[^\s]+|prosody\.(word-stress|sentence-stress|rhythm)|prosody\.intonation\.[^\s]+|connected\.(reduction\.[^\s]+|linking|elision|assimilation))$/.test(value)
}

export function listTargets(): readonly PronunciationTarget[] {
  return Object.values(PRONUNCIATION_TARGETS)
}

export function listTargetsByCefr(maxLevel: PronunciationTarget['recommendedCefr']): readonly PronunciationTarget[] {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const maxIndex = order.indexOf(maxLevel)
  return listTargets().filter((t) => order.indexOf(t.recommendedCefr) <= maxIndex)
}

/** Full prerequisite chain for a target, ordered from deepest dependency first. Cycle-safe. */
export function resolvePrerequisiteChain(targetId: PronunciationTargetId): PronunciationTargetId[] {
  const visited = new Set<string>()
  const chain: PronunciationTargetId[] = []

  function visit(current: string) {
    if (visited.has(current)) return
    visited.add(current)
    const target = PRONUNCIATION_TARGETS[current]
    if (!target) return
    for (const prereq of target.prerequisites) visit(prereq)
    if (current !== targetId) chain.push(id(current))
  }

  const start = PRONUNCIATION_TARGETS[targetId]
  if (start) for (const prereq of start.prerequisites) visit(prereq)
  return chain
}

/** Adapts a legacy `contrast_id = "ipaA|ipaB"` row into a registry target id. */
export function contrastIdToTargetId(contrastId: string): PronunciationTargetId {
  const [ipaA, ipaB, ...rest] = contrastId.split('|')
  return rest.length === 0 && ipaA && ipaB
    ? contrastTargetId(
        ipaA.startsWith('/') ? ipaA : `/${ipaA}/`,
        ipaB.startsWith('/') ? ipaB : `/${ipaB}/`
      )
    : id(`segmental.contrast.${contrastId}`)
}

/** Inverse of `contrastIdToTargetId`. Returns null for non-contrast target ids. */
export function targetIdToContrastId(targetId: PronunciationTargetId): string | null {
  const prefix = 'segmental.contrast.'
  if (!targetId.startsWith(prefix)) return null
  return targetId
    .slice(prefix.length)
    .split('|')
    .map((part) => part.replace(/^\//, '').replace(/\/$/, ''))
    .join('|')
}

function hasCycle(targetId: string, all: Record<string, PronunciationTarget>): boolean {
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(current: string): boolean {
    if (visited.has(current)) return false
    if (visiting.has(current)) return true
    visiting.add(current)
    const target = all[current]
    if (target) {
      for (const prereq of target.prerequisites) {
        if (visit(prereq)) return true
      }
    }
    visiting.delete(current)
    visited.add(current)
    return false
  }

  return visit(targetId)
}

/**
 * Validates one target against registry-wide invariants. Does not mutate
 * the registry — used by tests and by content-authoring tooling to reject
 * bad fixtures before they're added to `PRONUNCIATION_TARGETS`.
 */
export function validateTarget(
  target: PronunciationTarget,
  allTargets: Record<string, PronunciationTarget> = PRONUNCIATION_TARGETS as Record<string, PronunciationTarget>
): TargetValidationIssue[] {
  const issues: TargetValidationIssue[] = []

  for (const prereq of target.prerequisites) {
    if (!allTargets[prereq] && prereq !== target.id) {
      issues.push({
        targetId: target.id,
        code: 'missing_prerequisite',
        detail: `prerequisite "${prereq}" does not exist in the registry`,
      })
    }
  }

  const merged = { ...allTargets, [target.id]: target }
  if (hasCycle(target.id, merged)) {
    issues.push({
      targetId: target.id,
      code: 'cycle',
      detail: 'prerequisite chain contains a cycle',
    })
  }

  const claimsUnavailable = target.evidenceCapabilities.filter((c: EvidenceCapability) =>
    UNAVAILABLE_EVIDENCE_CAPABILITIES.includes(c)
  )
  if (claimsUnavailable.length > 0) {
    issues.push({
      targetId: target.id,
      code: 'unavailable_capability',
      detail: `claims unavailable capability: ${claimsUnavailable.join(', ')} — no validated evaluator exists (see ADR 064, plan 071)`,
    })
  }

  if (target.masteryEligible) {
    const hasObjective = target.evidenceCapabilities.some((c: EvidenceCapability) =>
      OBJECTIVE_EVIDENCE_CAPABILITIES.includes(c)
    )
    if (!hasObjective) {
      issues.push({
        targetId: target.id,
        code: 'no_objective_capability',
        detail: 'masteryEligible targets must declare at least one objective evidence capability (stt_intelligibility or acoustic)',
      })
    }
  }

  if (target.category === 'segmental.contrast' && target.contrastPair) {
    const [a, b] = target.contrastPair
    const expected = contrastTargetId(a, b)
    if (target.id !== expected) {
      issues.push({
        targetId: target.id,
        code: 'invalid_contrast_pair',
        detail: `id does not match canonical contrast key for [${a}, ${b}]; expected "${expected}"`,
      })
    }
  }

  return issues
}

/** Validates the whole frozen registry: uniqueness, acyclicity, all per-target rules. */
export function validateRegistry(): TargetValidationIssue[] {
  const issues: TargetValidationIssue[] = []
  const seen = new Set<string>()

  for (const target of listTargets()) {
    if (seen.has(target.id)) {
      issues.push({ targetId: target.id, code: 'duplicate_id', detail: 'duplicate target id in registry' })
    }
    seen.add(target.id)
    issues.push(...validateTarget(target))
  }

  return issues
}

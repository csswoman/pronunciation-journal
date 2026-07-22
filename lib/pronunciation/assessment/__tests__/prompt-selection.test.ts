import { describe, expect, it } from 'vitest'
import { listTargets } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import {
  MAX_SELECTED_TARGETS,
  MIN_SELECTED_TARGETS,
  selectDiagnosticPrompts,
} from '../prompt-selection'

const ALL_TARGET_IDS = listTargets().map((t) => t.id)

describe('selectDiagnosticPrompts', () => {
  it('bounds the number of selected items to a compact subset (never the full registry)', () => {
    const selection = selectDiagnosticPrompts({ seed: 'user-1', cefrLevel: 'B1' })

    expect(selection.length).toBeGreaterThanOrEqual(MIN_SELECTED_TARGETS)
    expect(selection.length).toBeLessThanOrEqual(MAX_SELECTED_TARGETS)
    expect(selection.length).toBeLessThan(ALL_TARGET_IDS.length)
  })

  it('never selects every target in the registry (never ask all dimensions)', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 12345, 67890]) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'C2' })
      expect(selection.length).toBeLessThan(ALL_TARGET_IDS.length)
    }
  })

  it('never selects duplicate targets within one run', () => {
    for (const seed of ['x', 'y', 'z', 1, 2, 3, 'diagnostic-seed-99']) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'B2' })
      const ids = selection.map((s) => s.targetId)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('always includes at least one contextual_production (phrase transfer) prompt', () => {
    for (const seed of ['seed-1', 'seed-2', 'seed-3', 'seed-4', 'seed-5', 99, 100, 101]) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'B1' })
      const hasTransfer = selection.some((s) => s.stage === 'contextual_production')
      expect(hasTransfer).toBe(true)
    }
  })

  it('always includes at least one contextual_production prompt at cefrLevel A2, even though the registry has zero contextual_production-capable targets recommendedCefr <= A2 (regression)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'A2' })
      const hasTransfer = selection.some((s) => s.stage === 'contextual_production')
      expect(hasTransfer).toBe(true)
    }
  })

  it('always includes at least one contextual_production prompt at cefrLevel A1 (regression)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'A1' })
      const hasTransfer = selection.some((s) => s.stage === 'contextual_production')
      expect(hasTransfer).toBe(true)
    }
  })

  it('is deterministic: same seed + same inputs always produce the same output', () => {
    const options = { seed: 'stable-seed-42', cefrLevel: 'B1' as const }
    const first = selectDiagnosticPrompts(options)
    const second = selectDiagnosticPrompts(options)
    expect(second).toEqual(first)
  })

  it('is deterministic across numeric and string seeds independently', () => {
    const a = selectDiagnosticPrompts({ seed: 777, cefrLevel: 'A2' })
    const b = selectDiagnosticPrompts({ seed: 777, cefrLevel: 'A2' })
    expect(a).toEqual(b)
  })

  it('different seeds can (and typically do) produce different selections', () => {
    const outputs = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'B2' })
      outputs.add(JSON.stringify(selection.map((s) => s.targetId).sort()))
    }
    // Not every seed needs to differ, but across 20 seeds we should see more
    // than a single fixed selection — otherwise the PRNG isn't wired in.
    expect(outputs.size).toBeGreaterThan(1)
  })

  it('weights Spanish-L1 confusable contrast targets into selection more often than a low-weight baseline target', () => {
    const contrastIds: PronunciationTargetId[] = ALL_TARGET_IDS.filter((id) =>
      id.startsWith('segmental.contrast.')
    )
    expect(contrastIds.length).toBeGreaterThan(0)

    let contrastHits = 0
    let assimilationHits = 0
    const runs = 60
    for (let seed = 0; seed < runs; seed++) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'C2' })
      const ids = new Set(selection.map((s) => s.targetId))
      if (contrastIds.some((c) => ids.has(c))) contrastHits++
      if (ids.has('connected.assimilation' as PronunciationTargetId)) assimilationHits++
    }

    expect(contrastHits).toBeGreaterThan(assimilationHits)
  })

  it('biases target selection toward the requested CEFR level while still allowing foundational targets', () => {
    const selection = selectDiagnosticPrompts({ seed: 'cefr-check', cefrLevel: 'A2' })
    // A2 cap should exclude B1+/C-only targets like elision/assimilation (B2).
    const ids = selection.map((s) => s.targetId)
    expect(ids).not.toContain('connected.elision')
    expect(ids).not.toContain('connected.assimilation')
  })

  it('preserves CEFR bias for the general (non-transfer) pool at cefrLevel A1, despite the registry having no A1-recommended targets (regression)', () => {
    // The registry's lowest recommendedCefr is A2, so listTargetsByCefr('A1')
    // returns []. The general pool must floor-fallback to A2 content, not
    // escalate to the full C2-capped registry — otherwise B2-only targets
    // like elision/assimilation would leak into every non-transfer slot of
    // an A1 diagnostic run. The pinned transfer slot is exempt by design
    // (it unconditionally searches the full registry per the earlier fix),
    // so this checks only the non-transfer entries in the selection.
    const b2OnlyIds = new Set(['connected.elision', 'connected.assimilation'])
    for (let seed = 0; seed < 50; seed++) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'A1' })
      const nonTransferIds = selection
        .filter((s) => s.stage !== 'contextual_production')
        .map((s) => s.targetId)
      for (const id of nonTransferIds) {
        expect(b2OnlyIds.has(id)).toBe(false)
      }
    }
  })

  it('deprioritizes targets that already have existing evidence in favor of gaps', () => {
    const wellEvidenced = new Set<PronunciationTargetId>(
      ALL_TARGET_IDS.filter((id) => id.startsWith('segmental.contrast.'))
    )

    let contrastHitsWithEvidence = 0
    let contrastHitsWithoutEvidence = 0
    const runs = 60
    for (let seed = 0; seed < runs; seed++) {
      const withEvidence = selectDiagnosticPrompts({
        seed,
        cefrLevel: 'C2',
        existingEvidence: wellEvidenced,
      })
      const withoutEvidence = selectDiagnosticPrompts({ seed, cefrLevel: 'C2' })

      if (withEvidence.some((s) => wellEvidenced.has(s.targetId))) contrastHitsWithEvidence++
      if (withoutEvidence.some((s) => wellEvidenced.has(s.targetId))) contrastHitsWithoutEvidence++
    }

    expect(contrastHitsWithEvidence).toBeLessThan(contrastHitsWithoutEvidence)
  })

  it('produces target coverage across categories over many runs (no target is permanently unreachable)', () => {
    const seenIds = new Set<string>()
    for (let seed = 0; seed < 200; seed++) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'C2' })
      for (const s of selection) seenIds.add(s.targetId)
    }
    // Every registry target should be reachable across enough runs at the
    // highest CEFR cap (which includes all targets in the eligible pool).
    for (const id of ALL_TARGET_IDS) {
      expect(seenIds.has(id)).toBe(true)
    }
  })

  it('only assigns stages that are actually supported by the target evidenceCapabilities', () => {
    const targets = listTargets()
    const byId = new Map(targets.map((t) => [t.id, t]))
    for (const seed of ['s1', 's2', 's3', 42]) {
      const selection = selectDiagnosticPrompts({ seed, cefrLevel: 'C2' })
      for (const s of selection) {
        const target = byId.get(s.targetId)
        expect(target).toBeDefined()
        expect(target!.evidenceCapabilities).toContain(s.stage)
      }
    }
  })
})

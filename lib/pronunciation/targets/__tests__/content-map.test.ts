import { describe, expect, it } from 'vitest'
import {
  CONTENT_MAP,
  UNMAPPED_AUDIT,
  getContentForTarget,
  getCoverageSummary,
} from '../content-map'
import { getContentMapIssues } from '../content-map-audit'
import { contrastTargetId, targetId } from '../registry'

describe('content map', () => {
  it('has zero dangling target or file references', () => {
    expect(getContentMapIssues()).toEqual([])
  }, 15000)

  it('produces a deterministic coverage summary by category', () => {
    const first = getCoverageSummary()
    const second = getCoverageSummary()
    expect(first).toEqual(second)
    expect(Object.keys(first).length).toBeGreaterThan(0)
  })

  it('returns mapped content for a known target', () => {
    const entries = getContentForTarget(targetId('connected.linking'))
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.every((e) => e.targetId === 'connected.linking')).toBe(true)
  })

  it('returns no entries for a target with no authored content', () => {
    const entries = getContentForTarget(contrastTargetId('/iː/', '/ɪ/'))
    expect(entries).toEqual([])
  })

  it('documents every unmapped-audit entry with a non-empty reason', () => {
    expect(UNMAPPED_AUDIT.length).toBeGreaterThan(0)
    for (const entry of UNMAPPED_AUDIT) {
      expect(entry.reason.length).toBeGreaterThan(0)
    }
  })

  it('does not include any unmapped-audit slug in CONTENT_MAP', () => {
    const unmappedSlugs = new Set(UNMAPPED_AUDIT.map((e) => `${e.kind}:${e.slug}`))
    for (const entry of CONTENT_MAP) {
      expect(unmappedSlugs.has(`${entry.kind}:${entry.slug}`)).toBe(false)
    }
  })
})

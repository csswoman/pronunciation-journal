import { expandVariants } from './variants'

const THRESHOLD = 0.6

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function variantPattern(variant: string): RegExp {
  const normalized = normalizeText(variant)
  const escaped = escapeRegExp(normalized).replace(/\\ /g, '\\s+')
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, 'u')
}

/**
 * True if `passage` embeds at least 60% of `targets`, matching each target by
 * any of its surface variants on lexical boundaries (never substring).
 *
 * Algorithm (mirrored by the test):
 *  1. normalize passage: lowercase, NFC, collapse whitespace.
 *  2. expand each target to its variant set (table-first, then suffix rules).
 *  3. a target matches if ANY variant appears on lexical boundaries.
 *  4. count matched targets.
 *  5. matched / total >= 0.6 → valid.
 */
export function passageEmbedsTargets(passage: string, targets: string[]): boolean {
  if (targets.length === 0) return true
  const normalized = normalizeText(passage)

  let matched = 0
  for (const target of targets) {
    const variants = expandVariants(target)
    const hit = variants.some((v) => variantPattern(v).test(normalized))
    if (hit) matched++
  }
  return matched / targets.length >= THRESHOLD
}

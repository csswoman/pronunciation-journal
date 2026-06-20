import { IRREGULAR_FORMS } from './irregular-forms'

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

/** Lowercased surface variants accepted for `target` (table-first, then regular suffix rules). */
export function expandVariants(target: string): string[] {
  const base = target.trim().toLowerCase()
  if (!base) return []

  const irregular = IRREGULAR_FORMS[base]
  if (irregular) return Array.from(new Set([base, ...irregular]))

  const out = new Set<string>([base])

  // plural / 3rd person
  if (/(s|x|z|ch|sh)$/.test(base)) out.add(base + 'es')
  else if (/[^aeiou]y$/.test(base)) out.add(base.slice(0, -1) + 'ies')
  else out.add(base + 's')

  // past / participle (regular)
  if (base.endsWith('e')) out.add(base + 'd')
  else if (/[^aeiou]y$/.test(base)) out.add(base.slice(0, -1) + 'ied')
  else if (isCvc(base)) out.add(base + base[base.length - 1] + 'ed')
  else out.add(base + 'ed')

  // gerund
  if (base.endsWith('e') && !base.endsWith('ee')) out.add(base.slice(0, -1) + 'ing')
  else if (isCvc(base)) out.add(base + base[base.length - 1] + 'ing')
  else out.add(base + 'ing')

  return Array.from(out)
}

/** Consonant-vowel-consonant ending (triggers final-consonant doubling). */
function isCvc(w: string): boolean {
  if (w.length < 3) return false
  const [a, b, c] = [w[w.length - 3], w[w.length - 2], w[w.length - 1]]
  return !VOWELS.has(a) && VOWELS.has(b) && !VOWELS.has(c) && !['w', 'x', 'y'].includes(c)
}

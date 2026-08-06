import type { EssentialWordPos } from './types'

/** Closed-class POS where syntactic position often beats a dictionary gloss. */
export const FUNCTIONAL_WORD_POS = [
  'pronoun',
  'preposition',
  'conjunction',
  'determiner',
  'article',
  'modal',
  'auxiliary',
] as const satisfies readonly EssentialWordPos[]

const FUNCTIONAL_SET = new Set<EssentialWordPos>(FUNCTIONAL_WORD_POS)

export function isFunctionalWordClass(pos: EssentialWordPos): boolean {
  return FUNCTIONAL_SET.has(pos)
}

/**
 * Contractions helper: deterministic equivalence and bounded variants.
 * Handles English auxiliary and modal contractions without arbitrary possessive expansion.
 */

export const UNAMBIGUOUS_CONTRACTIONS: Record<string, string> = {
  "aren't": 'are not',
  "can't": 'cannot',
  "couldn't": 'could not',
  "didn't": 'did not',
  "doesn't": 'does not',
  "don't": 'do not',
  "hadn't": 'had not',
  "hasn't": 'has not',
  "haven't": 'have not',
  "isn't": 'is not',
  "mustn't": 'must not',
  "needn't": 'need not',
  "oughtn't": 'ought not',
  "shouldn't": 'should not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "won't": 'will not',
  "wouldn't": 'would not',
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "they've": 'they have',
  "could've": 'could have',
  "should've": 'should have',
  "would've": 'would have',
  "might've": 'might have',
  "must've": 'must have',
  "i'll": 'i will',
  "you'll": 'you will',
  "he'll": 'he will',
  "she'll": 'she will',
  "it'll": 'it will',
  "we'll": 'we will',
  "they'll": 'they will',
  "that'll": 'that will',
  "there'll": 'there will',
  "let's": 'let us',
  "here's": 'here is',
}

export const AMBIGUOUS_CONTRACTIONS: Record<string, readonly string[]> = {
  "he's": ['he is', 'he has'],
  "she's": ['she is', 'she has'],
  "it's": ['it is', 'it has'],
  "that's": ['that is', 'that has'],
  "there's": ['there is', 'there has'],
  "who's": ['who is', 'who has'],
  "what's": ['what is', 'what has'],
  "where's": ['where is', 'where has'],
  "how's": ['how is', 'how has'],
  "i'd": ['i would', 'i had'],
  "you'd": ['you would', 'you had'],
  "he'd": ['he would', 'he had'],
  "she'd": ['she would', 'she had'],
  "we'd": ['we would', 'we had'],
  "they'd": ['they would', 'they had'],
  "it'd": ['it would', 'it had'],
  "who'd": ['who would', 'who had'],
  "what'd": ['what would', 'what had'],
}

export const ALL_CONTRACTION_KEYS = new Set([
  ...Object.keys(UNAMBIGUOUS_CONTRACTIONS),
  ...Object.keys(AMBIGUOUS_CONTRACTIONS),
])

function buildExpansionsMap(): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const [contraction, expansion] of Object.entries(UNAMBIGUOUS_CONTRACTIONS)) {
    const list = [expansion]
    if (contraction === "can't") list.push('can not')
    map.set(contraction, list)
  }
  for (const [contraction, expansions] of Object.entries(AMBIGUOUS_CONTRACTIONS)) {
    map.set(contraction, [...expansions])
  }
  return map
}

const EXPANSIONS_MAP = buildExpansionsMap()

const LIKELY_PAST_PARTICIPLES = new Set([
  'been', 'become', 'begun', 'bitten', 'blown', 'broken', 'brought', 'built', 'bought', 'called', 'caught', 'changed', 'checked',
  'chosen', 'cleaned', 'closed', 'come', 'cost', 'cut', 'dealt', 'done', 'drawn', 'driven', 'eaten', 'ended', 'fallen',
  'felt', 'finished', 'fought', 'found', 'flown', 'forgotten', 'forgiven', 'frozen', 'given', 'gone', 'got', 'grown', 'heard',
  'held', 'helped', 'hidden', 'hit', 'hurt', 'kept', 'known', 'laid', 'led', 'left', 'lent', 'let', 'lived', 'lost', 'loved',
  'made', 'meant', 'met', 'moved', 'opened', 'paid', 'painted', 'played', 'planned', 'put', 'read', 'ridden', 'risen', 'run',
  'said', 'seen', 'sold', 'sent', 'set', 'shaken', 'shown', 'shut', 'sung', 'sunk', 'sat', 'slept', 'spoken', 'spent',
  'split', 'spread', 'started', 'stayed', 'stood', 'stolen', 'stuck', 'studied', 'struck', 'sworn', 'swum', 'taken', 'talked',
  'taught', 'told', 'thought', 'thrown', 'tried', 'understood', 'used', 'visited', 'walked', 'watched', 'woken', 'worked', 'worn', 'won', 'written',
])

const FORMS_SHARED_BY_BASE_AND_PARTICIPLE = new Set([
  'bet', 'burst', 'cast', 'cost', 'cut', 'fit', 'hit', 'hurt', 'let', 'put', 'read', 'rid',
  'set', 'shut', 'split', 'spread', 'thrust', 'wed',
])

const AUXILIARY_MODIFIERS = new Set([
  'already', 'ever', 'just', 'never', 'not', 'probably', 'really', 'still', 'yet',
])

const ALL_EXPANDED_PHRASES = Array.from(new Set(Array.from(EXPANSIONS_MAP.values()).flat()))
const UNCONTRACTED_REGEXES = ALL_EXPANDED_PHRASES.map((phrase) => new RegExp(`\\b${phrase}\\b`, 'i'))

export function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase('en-US')
    .replaceAll('’', "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/(^|\s)'+|'+(\s|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasContractedForm(text: string): boolean {
  const words = normalizeText(text).split(/\s+/).filter(Boolean)
  return words.some((w) => ALL_CONTRACTION_KEYS.has(w))
}

export function hasUncontractedForm(text: string): boolean {
  const norm = normalizeText(text)
  return UNCONTRACTED_REGEXES.some((regex) => regex.test(norm))
}

export function getExpansionsForToken(token: string): readonly string[] {
  return EXPANSIONS_MAP.get(token) ?? []
}

function isLikelyPastParticiple(token: string): boolean {
  return LIKELY_PAST_PARTICIPLES.has(token)
}

/**
 * Resolve 's/'d only when the following verb form supports the auxiliary.
 * Unknown forms do not authorize the less obvious has/had expansion.
 */
function getContextualExpansions(token: string, tokens: readonly string[], index: number): readonly string[] {
  const expansions = getExpansionsForToken(token)
  if (!AMBIGUOUS_CONTRACTIONS[token]) return expansions

  let nextIndex = index + 1
  while (nextIndex < tokens.length && AUXILIARY_MODIFIERS.has(tokens[nextIndex])) {
    nextIndex++
  }

  const following = tokens[nextIndex]
  if (!following) return []

  const isParticiple = isLikelyPastParticiple(following)
  if (token.endsWith("'d")) {
    const takesBaseVerb = following === 'be' || following === 'have'
    const alsoBaseForm = FORMS_SHARED_BY_BASE_AND_PARTICIPLE.has(following)
    return expansions.filter((expansion) => {
      const isHad = expansion.endsWith(' had')
      return isHad
        ? isParticiple && !takesBaseVerb
        : takesBaseVerb || !isParticiple || alsoBaseForm
    })
  }

  if (token.endsWith("'s")) {
    return expansions.filter((expansion) => {
      const isHas = expansion.endsWith(' has')
      return isHas ? isParticiple : following !== 'been' && following !== 'got'
    })
  }

  return expansions
}

/**
 * Checks whether textA and textB are equivalent under valid contractions.
 * Operates via memoized token alignment, avoiding combinatorial expansion.
 * The memo has at most tokensA.length * tokensB.length states.
 */
export function areContractionEquivalent(textA: string, textB: string): boolean {
  const tokensA = normalizeText(textA).split(/\s+/).filter(Boolean)
  const tokensB = normalizeText(textB).split(/\s+/).filter(Boolean)

  if (tokensA.length === 0 && tokensB.length === 0) return true
  if (tokensA.length === 0 || tokensB.length === 0) return false

  const memo = new Map<string, boolean>()

  function match(i: number, j: number): boolean {
    if (i === tokensA.length && j === tokensB.length) return true
    if (i >= tokensA.length || j >= tokensB.length) return false

    const memoKey = `${i}:${j}`
    const cached = memo.get(memoKey)
    if (cached !== undefined) return cached

    const a = tokensA[i]
    const b = tokensB[j]

    // 1. Direct equality
    if (a === b && match(i + 1, j + 1)) {
      memo.set(memoKey, true)
      return true
    }

    // 2. 1 token vs 1 token (e.g. can't vs cannot)
    const expA = getContextualExpansions(a, tokensA, i)
    if (expA.includes(b) && match(i + 1, j + 1)) {
      memo.set(memoKey, true)
      return true
    }
    const expB = getContextualExpansions(b, tokensB, j)
    if (expB.includes(a) && match(i + 1, j + 1)) {
      memo.set(memoKey, true)
      return true
    }

    // 3. 1 token in A matches 2 tokens in B (e.g. a="he's", b+next="he has")
    if (j + 1 < tokensB.length) {
      const twoB = `${b} ${tokensB[j + 1]}`
      if (expA.includes(twoB) && match(i + 1, j + 2)) {
        memo.set(memoKey, true)
        return true
      }
    }

    // 4. 2 tokens in A match 1 token in B (e.g. a+next="he has", b="he's")
    if (i + 1 < tokensA.length) {
      const twoA = `${a} ${tokensA[i + 1]}`
      if (expB.includes(twoA) && match(i + 2, j + 1)) {
        memo.set(memoKey, true)
        return true
      }
    }

    memo.set(memoKey, false)
    return false
  }

  return match(0, 0)
}

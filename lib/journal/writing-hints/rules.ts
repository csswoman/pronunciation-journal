import type { WritingHintMatch } from './types'

const IRREGULAR_PAST_MAP: Record<string, string> = {
  goed: 'went',
  runned: 'ran',
  eated: 'ate',
  buyed: 'bought',
  bringed: 'brought',
  thinked: 'thought',
  catched: 'caught',
  sended: 'sent',
  taked: 'took',
  maked: 'made',
}

const IRREGULAR_PLURAL_MAP: Record<string, string> = {
  childs: 'children',
  peoples: 'people',
  mans: 'men',
  womans: 'women',
  foots: 'feet',
  tooths: 'teeth',
  mouses: 'mice',
}

function matchesFor(
  text: string,
  pattern: RegExp,
  ruleId: WritingHintMatch['ruleId'],
): WritingHintMatch[] {
  const matches: WritingHintMatch[] = []
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue
    matches.push({ start: match.index, end: match.index + match[0].length, ruleId })
  }
  return matches
}

export function detectIrregularPast(text: string): WritingHintMatch[] {
  const words = Object.keys(IRREGULAR_PAST_MAP)
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi')
  return matchesFor(text, pattern, 'irregular-past')
}

const PAST_TIME_MARKERS = ['yesterday', 'last week', 'last month', 'last year', 'last night']

export function detectMissingPastEd(text: string): WritingHintMatch[] {
  const matches: WritingHintMatch[] = []
  for (const marker of PAST_TIME_MARKERS) {
    const markerPattern = new RegExp(`\\b${marker}\\b[^.!?]*`, 'gi')
    for (const clause of text.matchAll(markerPattern)) {
      if (clause.index === undefined) continue
      const clauseText = clause[0]
      const verbPattern = /\bI\s+([a-z]+)\b/i
      const verbMatch = clauseText.match(verbPattern)
      if (!verbMatch || verbMatch.index === undefined) continue
      const verb = verbMatch[1]
      if (/ed$/i.test(verb) || Object.keys(IRREGULAR_PAST_MAP).includes(verb.toLowerCase())) continue
      if (verb.toLowerCase() === 'was' || verb.toLowerCase() === 'had') continue
      const verbStart = clause.index + verbMatch.index + verbMatch[0].indexOf(verb)
      matches.push({ start: verbStart, end: verbStart + verb.length, ruleId: 'missing-past-ed' })
    }
  }
  return matches
}

export function detectAmAgree(text: string): WritingHintMatch[] {
  return matchesFor(text, /\bam\s+agree\b/gi, 'am-agree')
}

export function detectDoubleNegative(text: string): WritingHintMatch[] {
  return matchesFor(
    text,
    /\b(don't|doesn't|didn't|can't|won't|isn't|aren't)\s+\w*\s*no\b/gi,
    'double-negative',
  )
}

export function detectMissingThirdPersonS(text: string): WritingHintMatch[] {
  const pattern = /\b(he|she|it)\s+([a-z]+)\b/gi
  const matches: WritingHintMatch[] = []
  const bareIrregularExceptions = new Set(['is', 'has', 'was', 'does', 'goes'])
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue
    const verb = match[2].toLowerCase()
    if (bareIrregularExceptions.has(verb)) continue
    if (/s$/i.test(verb) || /ed$/i.test(verb) || /ing$/i.test(verb)) continue
    const verbStart = match.index + match[0].indexOf(match[2], match[1].length)
    matches.push({ start: verbStart, end: verbStart + match[2].length, ruleId: 'missing-third-person-s' })
  }
  return matches
}

export function detectIrregularPlural(text: string): WritingHintMatch[] {
  const words = Object.keys(IRREGULAR_PLURAL_MAP)
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi')
  return matchesFor(text, pattern, 'irregular-plural')
}

const COMMON_CONTRACTIONS = ['dont', 'cant', 'wont', 'isnt', 'arent', 'wasnt', 'werent', 'didnt', 'doesnt', 'im', 'youre', 'theyre']

export function detectMissingApostrophe(text: string): WritingHintMatch[] {
  const pattern = new RegExp(`\\b(${COMMON_CONTRACTIONS.join('|')})\\b`, 'gi')
  return matchesFor(text, pattern, 'missing-apostrophe')
}

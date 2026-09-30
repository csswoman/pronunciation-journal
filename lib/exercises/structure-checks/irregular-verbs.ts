/**
 * Lista de ~180 verbos irregulares comunes en inglés con formas de pasado y participio.
 * Fuente: English irregular verbs list (Public Domain / Wiktionary open reference).
 */

export interface IrregularVerb {
  base: string
  past: string[]
  participle: string[]
}

// Compact table: base -> [past forms] -> [participle forms]
const IRREGULAR_DATA: [string, string, string][] = [
  ['arise', 'arose', 'arisen'],
  ['awake', 'awoke', 'awoken'],
  ['be', 'was,were', 'been'],
  ['bear', 'bore', 'born,borne'],
  ['beat', 'beat', 'beaten'],
  ['become', 'became', 'become'],
  ['begin', 'began', 'begun'],
  ['bend', 'bent', 'bent'],
  ['bet', 'bet', 'bet'],
  ['bind', 'bound', 'bound'],
  ['bite', 'bit', 'bitten'],
  ['bleed', 'bled', 'bled'],
  ['blow', 'blew', 'blown'],
  ['break', 'broke', 'broken'],
  ['breed', 'bred', 'bred'],
  ['bring', 'brought', 'brought'],
  ['broadcast', 'broadcast', 'broadcast'],
  ['build', 'built', 'built'],
  ['burn', 'burnt,burned', 'burnt,burned'],
  ['burst', 'burst', 'burst'],
  ['buy', 'bought', 'bought'],
  ['catch', 'caught', 'caught'],
  ['choose', 'chose', 'chosen'],
  ['cling', 'clung', 'clung'],
  ['come', 'came', 'come'],
  ['cost', 'cost', 'cost'],
  ['creep', 'crept', 'crept'],
  ['cut', 'cut', 'cut'],
  ['deal', 'dealt', 'dealt'],
  ['dig', 'dug', 'dug'],
  ['do', 'did', 'done'],
  ['draw', 'drew', 'drawn'],
  ['dream', 'dreamt,dreamed', 'dreamt,dreamed'],
  ['drink', 'drank', 'drunk'],
  ['drive', 'drove', 'driven'],
  ['eat', 'ate', 'eaten'],
  ['fall', 'fell', 'fallen'],
  ['feed', 'fed', 'fed'],
  ['feel', 'felt', 'felt'],
  ['fight', 'fought', 'fought'],
  ['find', 'found', 'found'],
  ['flee', 'fled', 'fled'],
  ['fly', 'flew', 'flown'],
  ['forbid', 'forbade', 'forbidden'],
  ['forget', 'forgot', 'forgotten'],
  ['forgive', 'forgave', 'forgiven'],
  ['freeze', 'froze', 'frozen'],
  ['get', 'got', 'got,gotten'],
  ['give', 'gave', 'given'],
  ['go', 'went', 'gone'],
  ['grow', 'grew', 'grown'],
  ['hang', 'hung', 'hung'],
  ['have', 'had', 'had'],
  ['hear', 'heard', 'heard'],
  ['hide', 'hid', 'hidden'],
  ['hit', 'hit', 'hit'],
  ['hold', 'held', 'held'],
  ['hurt', 'hurt', 'hurt'],
  ['keep', 'kept', 'kept'],
  ['kneel', 'knelt', 'knelt'],
  ['know', 'knew', 'known'],
  ['lay', 'laid', 'laid'],
  ['lead', 'led', 'led'],
  ['lean', 'leant,leaned', 'leant,leaned'],
  ['learn', 'learnt,learned', 'learnt,learned'],
  ['leave', 'left', 'left'],
  ['lend', 'lent', 'lent'],
  ['let', 'let', 'let'],
  ['lie', 'lay', 'lain'],
  ['light', 'lit', 'lit'],
  ['lose', 'lost', 'lost'],
  ['make', 'made', 'made'],
  ['mean', 'meant', 'meant'],
  ['meet', 'met', 'met'],
  ['pay', 'paid', 'paid'],
  ['put', 'put', 'put'],
  ['read', 'read', 'read'],
  ['ride', 'rode', 'ridden'],
  ['ring', 'rang', 'rung'],
  ['rise', 'rose', 'risen'],
  ['run', 'ran', 'run'],
  ['say', 'said', 'said'],
  ['see', 'saw', 'seen'],
  ['seek', 'sought', 'sought'],
  ['sell', 'sold', 'sold'],
  ['send', 'sent', 'sent'],
  ['set', 'set', 'set'],
  ['sew', 'sewed', 'sewn,sewed'],
  ['shake', 'shook', 'shaken'],
  ['shine', 'shone', 'shone'],
  ['shoot', 'shot', 'shot'],
  ['show', 'showed', 'shown'],
  ['shut', 'shut', 'shut'],
  ['sing', 'sang', 'sung'],
  ['sink', 'sank', 'sunk'],
  ['sit', 'sat', 'sat'],
  ['sleep', 'slept', 'slept'],
  ['slide', 'slid', 'slid'],
  ['speak', 'spoke', 'spoken'],
  ['spend', 'spent', 'spent'],
  ['spin', 'spun', 'spun'],
  ['spit', 'spat', 'spat'],
  ['split', 'split', 'split'],
  ['spoil', 'spoilt,spoiled', 'spoilt,spoiled'],
  ['spread', 'spread', 'spread'],
  ['spring', 'sprang', 'sprung'],
  ['stand', 'stood', 'stood'],
  ['steal', 'stole', 'stolen'],
  ['stick', 'stuck', 'stuck'],
  ['sting', 'stung', 'stung'],
  ['strike', 'struck', 'struck'],
  ['swear', 'swore', 'sworn'],
  ['sweep', 'swept', 'swept'],
  ['swim', 'swam', 'swum'],
  ['swing', 'swung', 'swung'],
  ['take', 'took', 'taken'],
  ['teach', 'taught', 'taught'],
  ['tear', 'tore', 'torn'],
  ['tell', 'told', 'told'],
  ['think', 'thought', 'thought'],
  ['throw', 'threw', 'thrown'],
  ['understand', 'understood', 'understood'],
  ['wake', 'woke', 'woken'],
  ['wear', 'wore', 'worn'],
  ['win', 'won', 'won'],
  ['wind', 'wound', 'wound'],
  ['write', 'wrote', 'written'],
]

const PAST_SET = new Set<string>()
const PARTICIPLE_SET = new Set<string>()
const VERB_MAP = new Map<string, IrregularVerb>()

for (const [base, pastStr, partStr] of IRREGULAR_DATA) {
  const past = pastStr.split(',')
  const participle = partStr.split(',')
  VERB_MAP.set(base, { base, past, participle })
  for (const p of past) PAST_SET.add(p)
  for (const part of participle) PARTICIPLE_SET.add(part)
}

/** Regla general para formas regulares en pasado/participio (-ed, -ied, etc.) */
export function regularPast(base: string): string {
  const b = base.toLowerCase()
  if (b.endsWith('e')) return `${b}d`
  if (b.endsWith('y') && !/[aeiou]y$/.test(b) && b.length > 2) return `${b.slice(0, -1)}ied`
  if (/[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnprtz]$/.test(b) && b.length <= 4) {
    return `${b}${b.slice(-1)}ed`
  }
  return `${b}ed`
}

export function pastForms(base: string): string[] {
  const entry = VERB_MAP.get(base.toLowerCase())
  if (entry) return entry.past
  return [regularPast(base)]
}

export function participleForms(base: string): string[] {
  const entry = VERB_MAP.get(base.toLowerCase())
  if (entry) return entry.participle
  return [regularPast(base)]
}

export function isPastSimpleVerb(word: string): boolean {
  const w = word.toLowerCase()
  if (PAST_SET.has(w)) return true
  return w.endsWith('ed') && w.length >= 4
}

export function isParticipleVerb(word: string): boolean {
  const w = word.toLowerCase()
  if (PARTICIPLE_SET.has(w)) return true
  return w.endsWith('ed') && w.length >= 4
}

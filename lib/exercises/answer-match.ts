import { diffWords } from './diff-words'
import type { ErrorCorrectionExercise, ReorderWordsExercise, SentenceTransformationExercise } from './types'

export interface AnswerSpec {
  /** Plantillas de respuestas válidas. `{a|b}` = alternativas; `{a|}` = opcional. La 1.ª expansión es la canónica. */
  accept: string[]
  /** Palabras que el ejercicio evalúa; nunca se les perdona tipeo. Si falta, se derivan. */
  targetTokens?: string[]
  /** 'equivalent' (default): I'm = I am. 'require': debe contraer. 'forbid': debe ir sin contraer. */
  contractions?: 'equivalent' | 'require' | 'forbid'
  /** Palabras que deben aparecer tal cual (palabra clave de B1–C1). */
  mustInclude?: string[]
  commonWrong?: { answer: string; feedback: string }[]
}

export interface MatchOptions {
  /** Del perfil de nivel (F1). Default 2. */
  maxTypos?: number
  /** Respuestas que la persona ya aceptó en su banco local (fase C). */
  extraAccepted?: string[]
}

export type AnswerVerdict =
  | { kind: 'exact' | 'variant'; score: 100; matched: string }
  | { kind: 'typo'; score: 90; matched: string; typos: { got: string; expected: string }[] }
  | { kind: 'contraction_mismatch'; matched: string; expectedForm: 'contracted' | 'full' }
  | { kind: 'missing_required'; missing: string[] }
  | { kind: 'known_wrong'; feedback: string }
  | { kind: 'no_match'; canonical: string }

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is',
  "it's": 'it is', "we're": 'we are', "they're": 'they are',
  "that's": 'that is', "there's": 'there is', "what's": 'what is', "who's": 'who is', "here's": 'here is',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not',
  "can't": 'cannot', "couldn't": 'could not',
  "won't": 'will not', "wouldn't": 'would not', "shouldn't": 'should not',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will',
  "i'd": 'i would', "you'd": 'you would', "he'd": 'he would', "she'd": 'she would',
  "we'd": 'we would', "they'd": 'they would', "let's": 'let us',
}

export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('en-US')
    .replaceAll('’', "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function expandTemplate(template: string): string[] {
  const parts: string[][] = []
  let lastIndex = 0
  const regex = /\{([^{}]+)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push([template.slice(lastIndex, match.index)])
    }
    parts.push(match[1].split('|'))
    lastIndex = regex.lastIndex
  }
  if (lastIndex < template.length) {
    parts.push([template.slice(lastIndex)])
  }
  if (parts.length === 0) return ['']

  const total = parts.reduce((acc, p) => acc * p.length, 1)
  if (total > 64) {
    throw new Error(`Template expansion exceeded limit of 64 (got ${total})`)
  }

  let combinations = parts[0]
  for (let i = 1; i < parts.length; i++) {
    const next: string[] = []
    for (const prefix of combinations) {
      for (const opt of parts[i]) {
        next.push(prefix + opt)
      }
    }
    combinations = next
  }
  return combinations
}

export function expandContractions(tokens: string[] | string): string[] {
  const words = Array.isArray(tokens)
    ? tokens.flatMap((t) => normalize(t).split(/\s+/).filter(Boolean))
    : normalize(tokens).split(/\s+/).filter(Boolean)

  const result: string[] = []
  for (const w of words) {
    const expanded = CONTRACTIONS[w]
    if (expanded) {
      result.push(...expanded.split(' '))
    } else {
      result.push(w)
    }
  }
  return result
}

function hasContractedForm(normalized: string): boolean {
  const words = normalized.split(/\s+/).filter(Boolean)
  return words.some((w) => w in CONTRACTIONS)
}

function hasUncontractedForm(normalized: string): boolean {
  for (const expanded of Object.values(CONTRACTIONS)) {
    const regex = new RegExp(`\\b${expanded}\\b`, 'i')
    if (regex.test(normalized)) return true
  }
  return false
}

export function damerauLevenshtein(a: string, b: string): number {
  const la = a.length
  const lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la

  const d: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0))
  for (let i = 0; i <= la; i++) d[i][0] = i
  for (let j = 0; j <= lb; j++) d[0][j] = j

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[la][lb]
}

export function matchAnswer(answer: string, spec: AnswerSpec, options?: MatchOptions): AnswerVerdict {
  const normUser = normalize(answer)
  const allExpansions = spec.accept.flatMap(expandTemplate)
  const canonical = allExpansions[0] ? normalize(allExpansions[0]) : ''
  if (!normUser) return { kind: 'no_match', canonical }

  if (spec.commonWrong) {
    for (const cw of spec.commonWrong) {
      if (normalize(cw.answer) === normUser) return { kind: 'known_wrong', feedback: cw.feedback }
    }
  }

  if (spec.mustInclude && spec.mustInclude.length > 0) {
    const userWords = new Set(normUser.split(/\s+/))
    const missing = spec.mustInclude.filter((req) => !userWords.has(normalize(req)))
    if (missing.length > 0) return { kind: 'missing_required', missing }
  }

  const contractionMode = spec.contractions ?? 'equivalent'
  const allowDirectMatch =
    (contractionMode !== 'require' || !hasUncontractedForm(normUser)) &&
    (contractionMode !== 'forbid' || !hasContractedForm(normUser))

  if (allowDirectMatch) {
    if (allExpansions.length > 0 && normalize(allExpansions[0]) === normUser) {
      return { kind: 'exact', score: 100, matched: allExpansions[0] }
    }
    for (let i = 1; i < allExpansions.length; i++) {
      if (normalize(allExpansions[i]) === normUser) {
        return { kind: 'variant', score: 100, matched: allExpansions[i] }
      }
    }
    if (options?.extraAccepted) {
      for (const extra of options.extraAccepted) {
        if (normalize(extra) === normUser) return { kind: 'variant', score: 100, matched: extra }
      }
    }
  }

  const userExpanded = expandContractions(normUser).join(' ')
  for (const exp of allExpansions) {
    const expExpanded = expandContractions(exp).join(' ')
    if (userExpanded === expExpanded) {
      if (contractionMode === 'require' && hasUncontractedForm(normUser)) {
        return { kind: 'contraction_mismatch', matched: allExpansions[0], expectedForm: 'contracted' }
      }
      if (contractionMode === 'forbid' && hasContractedForm(normUser)) {
        return { kind: 'contraction_mismatch', matched: allExpansions[0], expectedForm: 'full' }
      }
      return { kind: 'variant', score: 100, matched: exp }
    }
  }

  const maxTypos = options?.maxTypos ?? 2
  const targetTokens = new Set((spec.targetTokens ?? []).map(normalize))
  const mustInclude = new Set((spec.mustInclude ?? []).map(normalize))
  const userTokens = expandContractions(normUser)

  for (const exp of allExpansions) {
    const expTokens = expandContractions(exp)
    if (userTokens.length !== expTokens.length) continue

    let typoCount = 0
    let valid = true
    const typos: { got: string; expected: string }[] = []

    for (let i = 0; i < userTokens.length; i++) {
      const u = userTokens[i]
      const e = expTokens[i]
      if (u === e) continue

      if (e.length < 4 || targetTokens.has(e) || mustInclude.has(e)) {
        valid = false
        break
      }
      if (damerauLevenshtein(u, e) <= 1) {
        typoCount++
        typos.push({ got: u, expected: e })
        if (typoCount > maxTypos) {
          valid = false
          break
        }
      } else {
        valid = false
        break
      }
    }

    if (valid && typoCount > 0 && typoCount <= maxTypos) {
      return { kind: 'typo', score: 90, matched: exp, typos }
    }
  }

  return { kind: 'no_match', canonical }
}

export function specFromErrorCorrection(ex: ErrorCorrectionExercise): AnswerSpec {
  const insertWords = diffWords(ex.sentence, ex.correctSentence).modifiedDiff
    .filter((t) => t.type === 'insert')
    .map((t) => normalize(t.text))
    .filter(Boolean)
  return { accept: [ex.correctSentence], targetTokens: insertWords }
}

export function specFromTransformation(ex: SentenceTransformationExercise): AnswerSpec {
  const accept: string[] = []
  if (ex.referenceAnswer) accept.push(ex.referenceAnswer)
  if (ex.acceptedAnswers) {
    for (const a of ex.acceptedAnswers) {
      if (!accept.includes(a)) accept.push(a)
    }
  }
  const canonical = accept[0] ?? ''
  const insertWords = canonical
    ? diffWords(ex.sourceSentence, canonical).modifiedDiff
        .filter((t) => t.type === 'insert')
        .map((t) => normalize(t.text))
        .filter(Boolean)
    : []
  return { accept, targetTokens: insertWords }
}

export function specFromReorder(ex: ReorderWordsExercise): AnswerSpec {
  return {
    accept: [ex.sentence],
    targetTokens: normalize(ex.sentence).split(/\s+/).filter(Boolean),
    contractions: 'forbid',
  }
}

import { diffWords } from './diff-words'
import { expandTemplate } from './answer-match-templates'
import {
  areContractionEquivalent,
  hasContractedForm,
  hasUncontractedForm,
  UNAMBIGUOUS_CONTRACTIONS,
} from './contractions'
import type { ErrorCorrectionExercise, ReorderWordsExercise, SentenceTransformationExercise } from './types'

export { expandTemplate }

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

function contractionMismatch(
  answer: string,
  mode: AnswerSpec['contractions'],
  matched: string,
): Extract<AnswerVerdict, { kind: 'contraction_mismatch' }> | undefined {
  if (mode === 'require' && hasUncontractedForm(answer)) {
    return { kind: 'contraction_mismatch', matched, expectedForm: 'contracted' }
  }
  if (mode === 'forbid' && hasContractedForm(answer)) {
    return { kind: 'contraction_mismatch', matched, expectedForm: 'full' }
  }
  return undefined
}

const DEFAULT_CONTRACTION_EXPANSIONS: Record<string, string> = {
  ...UNAMBIGUOUS_CONTRACTIONS,
  "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is',
  "there's": 'there is', "what's": 'what is', "who's": 'who is', "here's": 'here is',
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

export function expandContractions(tokens: string[] | string): string[] {
  const words = Array.isArray(tokens)
    ? tokens.flatMap((t) => normalize(t).split(/\s+/).filter(Boolean))
    : normalize(tokens).split(/\s+/).filter(Boolean)

  const result: string[] = []
  for (const w of words) {
    const expanded = DEFAULT_CONTRACTION_EXPANSIONS[w]
    if (expanded) {
      result.push(...expanded.split(' '))
    } else {
      result.push(w)
    }
  }
  return result
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

  for (const exp of allExpansions) {
    if (areContractionEquivalent(normUser, exp)) {
      const mismatch = contractionMismatch(normUser, contractionMode, allExpansions[0])
      if (mismatch) return mismatch
      return { kind: 'variant', score: 100, matched: exp }
    }
  }

  if (options?.extraAccepted) {
    for (const extra of options.extraAccepted) {
      if (areContractionEquivalent(normUser, extra)) {
        const mismatch = contractionMismatch(normUser, contractionMode, extra)
        if (mismatch) return mismatch
        return { kind: 'variant', score: 100, matched: extra }
      }
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

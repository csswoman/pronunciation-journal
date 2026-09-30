import { checkStructures, STRUCTURE_CHECKS } from './structure-checks'
import type { PersonalizationExercise } from './types'

export interface PersonalizationGradeResult {
  ok: boolean
  issues: string[]
  hints: string[]
  assembledSentence?: string
}

const NUMBER_WORDS = new Set([
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred',
])

function isValidNumber(text: string): boolean {
  const trimmed = text.trim().toLowerCase()
  if (/^\d+$/.test(trimmed)) return true
  const parts = trimmed.replace(/-/g, ' ').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return false
  return parts.every((p) => NUMBER_WORDS.has(p))
}

function checkSoftWarnings(text: string): string[] {
  const warnings: string[] = []
  // a followed by a vowel letter (approximate hint)
  if (/\ba\s+[aeiou][a-z]+/i.test(text)) {
    warnings.push('Ojo: si la siguiente palabra empieza por vocal, suele usarse "an".')
  }
  return warnings
}

export function gradePersonalization(
  ex: PersonalizationExercise,
  input: string,
): PersonalizationGradeResult {
  const trimmed = input.trim()
  const issues: string[] = []
  const hints: string[] = []

  if (!trimmed) {
    return {
      ok: false,
      issues: ['Escribe tu respuesta antes de continuar.'],
      hints: [],
    }
  }

  if (ex.mode === 'frame') {
    const tokens = trimmed.split(/\s+/).filter(Boolean)

    if (ex.slot === 'number') {
      if (!isValidNumber(trimmed)) {
        issues.push('Escribe un número válido (en cifras o palabras).')
      }
    } else if (ex.slot === 'word') {
      if (tokens.length > 1) {
        issues.push('Escribe una sola palabra en este espacio.')
      }
    } else if (ex.slot === 'phrase') {
      if (tokens.length > 8) {
        issues.push('Escribe una frase breve (máximo 8 palabras).')
      }
    }

    const assembled = ex.frame.includes('___')
      ? ex.frame.replace('___', trimmed)
      : `${ex.frame} ${trimmed}`

    if (issues.length === 0 && ex.requires && ex.requires.length > 0) {
      const structRes = checkStructures(assembled, ex.requires)
      if (!structRes.ok) {
        for (const missingId of structRes.missing) {
          const checker = STRUCTURE_CHECKS[missingId]
          hints.push(checker?.hintEs ?? `Usa la estructura requerida (${missingId}).`)
        }
        issues.push('Falta incluir la estructura solicitada en la oración.')
      }
    }

    const soft = checkSoftWarnings(assembled)
    hints.push(...soft)

    return {
      ok: issues.length === 0,
      issues,
      hints,
      assembledSentence: assembled,
    }
  }

  // mode === 'open'
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length < ex.minWords) {
    issues.push(`Escribe al menos ${ex.minWords} palabras (llevas ${tokens.length}).`)
  }
  if (tokens.length > ex.maxWords) {
    issues.push(`Escribe máximo ${ex.maxWords} palabras (llevas ${tokens.length}).`)
  }

  if (ex.requires && ex.requires.length > 0) {
    const structRes = checkStructures(trimmed, ex.requires)
    if (!structRes.ok) {
      for (const missingId of structRes.missing) {
        const checker = STRUCTURE_CHECKS[missingId]
        hints.push(checker?.hintEs ?? `Usa la estructura requerida (${missingId}).`)
      }
      issues.push('Falta incluir la estructura gramatical solicitada.')
    }
  }

  const soft = checkSoftWarnings(trimmed)
  hints.push(...soft)

  return {
    ok: issues.length === 0,
    issues,
    hints,
    assembledSentence: trimmed,
  }
}

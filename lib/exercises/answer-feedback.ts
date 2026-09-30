import type { AnswerVerdict } from './answer-match'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export interface FeedbackContext {
  canonical?: string
  explanation?: string
}

export function feedbackFromVerdict(
  verdict: AnswerVerdict,
  ctx?: FeedbackContext,
): PedagogicalFeedback {
  const canonical = ctx?.canonical ?? (verdict.kind === 'no_match' ? verdict.canonical : undefined)

  switch (verdict.kind) {
    case 'exact':
      return {
        immediate: '¡Correcto!',
        expectedAnswer: canonical,
        explanation: ctx?.explanation,
        canRetry: false,
      }

    case 'variant': {
      const showCanonical =
        canonical &&
        verdict.matched &&
        canonical.trim().toLowerCase() !== verdict.matched.trim().toLowerCase()

      return {
        immediate: showCanonical ? `¡Correcto! También vale: ${canonical}` : '¡Correcto!',
        expectedAnswer: canonical ?? verdict.matched,
        explanation: ctx?.explanation,
        canRetry: false,
      }
    }

    case 'typo': {
      const typosText = verdict.typos.map((t) => `"${t.got}" → "${t.expected}"`).join(', ')
      return {
        immediate: `Ojo con la ortografía: ${typosText}`,
        expectedAnswer: canonical ?? verdict.matched,
        correction: verdict.matched,
        explanation: ctx?.explanation,
        canRetry: false,
      }
    }

    case 'contraction_mismatch': {
      const msg =
        verdict.expectedForm === 'contracted'
          ? `Correcto, pero la instrucción pide contraer: ${verdict.matched}`
          : `Correcto, pero la instrucción pide usar la forma sin contraer: ${verdict.matched}`
      return {
        immediate: msg,
        expectedAnswer: verdict.matched,
        correction: verdict.matched,
        explanation: ctx?.explanation,
        canRetry: true,
      }
    }

    case 'missing_required': {
      const words = verdict.missing.join(', ')
      return {
        immediate: `Usa la palabra "${words}" sin cambiarla.`,
        explanation: ctx?.explanation,
        canRetry: true,
      }
    }

    case 'known_wrong':
      return {
        immediate: verdict.feedback,
        explanation: ctx?.explanation,
        canRetry: true,
      }

    case 'no_match':
    default:
      return {
        immediate: 'Esa no es la respuesta esperada.',
        expectedAnswer: verdict.canonical,
        correction: verdict.canonical,
        explanation: ctx?.explanation,
        canRetry: true,
        errorCode: 'form_error',
      }
  }
}

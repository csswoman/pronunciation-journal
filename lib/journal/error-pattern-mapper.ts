import type { ErrorPatternId } from '@/lib/exercises/error-patterns'
import type { JournalError } from './correction'

/**
 * Mapea un JournalError devuelto por Gemini a la taxonomía cerrada de ErrorPatternId.
 * Si el error no corresponde a un patrón sistemático accionable, devuelve null.
 */
export function journalErrorToPatternId(error: JournalError): ErrorPatternId | null {
  const topic = (error.topic || '').toLowerCase().trim()
  const type = (error.type || '').toLowerCase().trim()
  const exp = (error.explanationEs || '').toLowerCase()

  // 1. Tiempos verbales pasados vs presentes
  if (
    topic.includes('past-simple') ||
    topic.includes('past_simple') ||
    topic.includes('past-tense') ||
    topic.includes('past_tense') ||
    type === 'tense' ||
    exp.includes('pasado simple') ||
    exp.includes('en pasado')
  ) {
    if (
      topic.includes('present-perfect') ||
      topic.includes('present_perfect') ||
      exp.includes('present perfect')
    ) {
      return 'present_perfect_vs_past'
    }
    return 'tense_present_for_past'
  }

  // 2. Present Perfect
  if (topic.includes('present-perfect') || topic.includes('present_perfect')) {
    return 'present_perfect_vs_past'
  }

  // 3. Preposiciones
  if (
    topic.includes('preposition') ||
    type.includes('preposition') ||
    exp.includes('preposición')
  ) {
    return 'preposition_choice'
  }

  // 4. Artículos (a/an/the)
  if (
    topic.includes('article') ||
    type.includes('article') ||
    exp.includes('artículo')
  ) {
    return 'article_use'
  }

  // 5. Orden de palabras (sintaxis)
  if (
    topic.includes('word-order') ||
    topic.includes('word_order') ||
    type.includes('word_order') ||
    exp.includes('orden de palabras') ||
    exp.includes('orden de las palabras')
  ) {
    return 'word_order'
  }

  // 6. Concordancia sujeto-verbo (agreement)
  if (
    topic.includes('agreement') ||
    topic.includes('third-person') ||
    type.includes('agreement') ||
    exp.includes('concordancia') ||
    exp.includes('tercera persona')
  ) {
    return 'subject_verb_agreement'
  }

  // 7. Auxiliares faltantes (do/does/did/be/have)
  if (
    topic.includes('auxiliary') ||
    type.includes('auxiliary') ||
    exp.includes('auxiliar')
  ) {
    return 'missing_auxiliary'
  }

  // 8. Modales
  if (
    topic.includes('modal') ||
    type.includes('modal') ||
    exp.includes('verbo modal')
  ) {
    return 'modal_form'
  }

  // 9. Condicionales
  if (
    topic.includes('conditional') ||
    type.includes('conditional') ||
    exp.includes('condicional')
  ) {
    return 'conditional_form'
  }

  // 10. Gerundio vs Infinitivo
  if (
    topic.includes('gerund') ||
    topic.includes('infinitive') ||
    exp.includes('gerundio') ||
    exp.includes('infinitivo')
  ) {
    return 'gerund_infinitive'
  }

  // 11. Comparativos y superlativos
  if (
    topic.includes('comparative') ||
    topic.includes('superlative') ||
    exp.includes('comparativo') ||
    exp.includes('superlativo')
  ) {
    return 'comparative_form'
  }

  // 12. Plurales / Contables
  if (
    topic.includes('plural') ||
    topic.includes('countable') ||
    exp.includes('plural') ||
    exp.includes('incontable')
  ) {
    return 'plural_countable'
  }

  // 13. Negación
  if (
    topic.includes('negation') ||
    type.includes('negation') ||
    exp.includes('negación')
  ) {
    return 'negation_form'
  }

  // 14. Preguntas
  if (
    topic.includes('question') ||
    type.includes('question') ||
    exp.includes('pregunta')
  ) {
    return 'question_form'
  }

  // 15. Ortografía (spelling)
  if (
    type === 'spelling' ||
    topic.includes('spelling') ||
    exp.includes('ortografía') ||
    exp.includes('escritura')
  ) {
    return 'spelling'
  }

  // 16. Vocabulario / elección de palabra
  if (
    type === 'vocabulary' ||
    type === 'collocation' ||
    topic.includes('vocabulary') ||
    exp.includes('vocabulario')
  ) {
    return 'vocabulary_choice'
  }

  return null
}

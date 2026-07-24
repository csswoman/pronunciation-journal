/** Maps raw AI error.type strings to short Spanish labels for learners. */
const KNOWN_LABELS: Record<string, string> = {
  tense: 'Tiempo verbal',
  grammar: 'Gramática',
  spelling: 'Ortografía',
  vocabulary: 'Vocabulario',
  article: 'Artículo',
  preposition: 'Preposición',
  word_order: 'Orden de palabras',
  agreement: 'Concordancia',
  punctuation: 'Puntuación',
  collocation: 'Combinación de palabras',
  register: 'Registro',
  naturalness: 'Naturalidad',
}

/**
 * Humanize a raw correction type for UI chips.
 * Unknown values stay readable (spaces, no raw snake_case).
 */
export function journalErrorTypeLabel(type: string): string {
  const key = type.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key]
  const cleaned = type.trim().replace(/[_-]+/g, ' ')
  if (!cleaned) return 'Detalle'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

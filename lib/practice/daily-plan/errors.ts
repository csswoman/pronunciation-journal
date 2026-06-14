/**
 * Conservada por compatibilidad con callers antiguos. `buildDailyPlan` ya NO
 * la lanza: el plan siempre se rellena desde el catálogo sembrado.
 */
export class EmptyWordBankError extends Error {
  readonly code = 'EMPTY_WORD_BANK'
  constructor() {
    super('No words in your word bank yet. Add some words from the Lexicon to start practicing.')
  }
}
